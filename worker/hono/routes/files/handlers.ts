import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import {
  addFileMetaToFolder,
  getFolderById,
} from '../../../repositories/folder-repository';
import type {
  CompleteFileUpload,
  GetFilePartUploadUrl,
  UploadNewFileRoute,
} from './routes';
import { createAwsClient } from '../../../lib/s3';
import {
  createMultiPartUpload,
  createPresignedPartUploadUrl,
  listMultipartUploads,
} from '../../../repositories/s3-repository';
import { createId } from '@paralleldrive/cuid2';
import { MS_IN_MINUTE } from '../../../../shared/constants';
import type { Folder } from '../../../../shared/schemas';
import { insertFile } from '../../../repositories/file-repository';
import { size } from 'better-auth';

const bucket = 'files-bucket';

type PendingFile = {
  key: string;
  lastActive: number;
  size: number;
};

export const uploadNewFile: AppRouteHandler<UploadNewFileRoute> = async (c) => {
  const { folderId, name, size } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // verify the folder exists
  const folder = await getFolderById(db, folderId);
  if (!folder) return c.notFound();

  if (folder.expiresAt < new Date()) {
    return c.json({ message: 'Folder has expired' }, 410);
  }

  if (size + folder.size > folder.maxSize) {
    return c.json({ message: 'File is too large for folder' }, 413);
  }

  const id = createId();
  const key = `${folder.creatorId}/${folderId}/${id}`;
  c.env.PENDING_FILE_UPLOADS.put(key, JSON.stringify({ folderId, size, name }));
  const res = await c.env.files_bucket.createMultipartUpload(key, {
    customMetadata: {
      folderId: folderId,
      name: name,
    },

    httpMetadata: {
      contentDisposition: `attachment; filename="${name}"`,
    },
  });

  return c.json(res, 200);
};

export const uploadFilePart: AppRouteHandler<GetFilePartUploadUrl> = async (
  c,
) => {
  const { partNumber } = c.req.param();
  const { uploadId, key } = c.req.query();

  const awsClient = createAwsClient(c.env);
  const signedUrl = await createPresignedPartUploadUrl(awsClient, {
    bucket,
    partNumber: parseInt(partNumber),
    uploadId,
    key,
  });

  return c.json({ url: signedUrl.url }, 200);
};

export const completeFileUpload: AppRouteHandler<CompleteFileUpload> = async (
  c,
) => {
  const { uploadId, key } = c.req.query();

  const upload = c.env.files_bucket.resumeMultipartUpload(key, uploadId);
  const parts = c.req.valid('json');

  try {
    await upload.complete(parts);
  } catch (e) {
    console.log(e);
    // todo delete the parts?
    return c.newResponse(null, 400);
  }

  const [cachedFile, objectHead] = await Promise.all([
    c.env.PENDING_FILE_UPLOADS.get(key, 'json'),
    c.env.files_bucket.head(key),
  ]);
  if (!objectHead?.customMetadata || !cachedFile) {
    // clearly something went wrong, delete object
    await c.env.files_bucket.delete(key);
    return c.newResponse(null, 400);
  }

  const { size: promisedSize } = cachedFile as PendingFile;
  // verify file size
  if (promisedSize !== objectHead.size) {
    await c.env.files_bucket.delete(key);
    return c.json(
      { message: 'Object size does not match agreed opon size' },
      400,
    );
  }
  // insert into folder
  const db = drizzle(c.env.DB);
  try {
    const res = await insertFile(db, objectHead);
    await addFileMetaToFolder(db, res);
    return c.json(res, 201);
  } catch (e) {
    await c.env.files_bucket.delete(key);
    console.log(e);
    return c.newResponse(null, 400);
  }
};
