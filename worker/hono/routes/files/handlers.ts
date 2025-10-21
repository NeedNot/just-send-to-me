import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import {
  addFileMetaToFolder,
  getFolderById,
} from '../../../repositories/folder-repository';
import type {
  AbortFileUpload,
  CompleteFileUpload,
  GetFilePartUploadUrl,
  UploadNewFileRoute,
} from './routes';
import { createAwsClient } from '../../../lib/s3';
import {
  createPresignedPartUploadUrl,
  listMultipartUploads,
} from '../../../repositories/s3-repository';
import { createId } from '@paralleldrive/cuid2';
import { insertFile } from '../../../repositories/file-repository';
import type { Folder } from '../../../../shared/schemas';
import { MS_IN_HOUR, MS_IN_MINUTE } from '../../../../shared/constants';

const bucket = 'files-bucket';
const CHUNK_SIZE = 1024 * 1024 * 10;

export type PendingFile = {
  size: number;
  lastActive: number;
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

  const multipartUploads = await listMultipartUploads(createAwsClient(c.env), {
    bucket,
    prefix: folder.creatorId + '/' + folder.id,
  });

  const pendingFiles = multipartUploads.Upload
    ? await c.env.PENDING_FILE_UPLOADS.get(
        multipartUploads.Upload.map((u) => u.Key),
        'json',
      ).then(
        (r) =>
          new Map<string, PendingFile>(
            [...r]
              .filter((f) => f[1] !== null)
              .map((f) => [f[0], f[1] as PendingFile] as [string, PendingFile]),
          ),
      )
    : null;

  if (pendingFiles) {
    const cancellableItems = findCancellableUploadsForSpace(
      size,
      folder,
      pendingFiles,
    );

    if (cancellableItems === null) {
      return c.json({ message: 'File is too large for folder' }, 413);
    }

    const promises = multipartUploads.Upload!.map(async (u) => {
      if (!cancellableItems.has(u.Key)) return;

      const session = c.env.FILES_BUCKET.resumeMultipartUpload(
        u.Key,
        u.UploadId,
      );
      await Promise.all([
        session.abort(),
        c.env.PENDING_FILE_UPLOADS.delete(u.Key),
      ]);
    });
    c.executionCtx.waitUntil(Promise.all(promises));
  }

  const id = createId();
  const key = `${folder.creatorId}/${folderId}/${id}`;
  c.env.PENDING_FILE_UPLOADS.put(
    key,
    JSON.stringify({ size, lastActive: Date.now() }),
    { expirationTtl: MS_IN_HOUR / 1000 },
  );
  const res = await c.env.FILES_BUCKET.createMultipartUpload(key, {
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

  const kv = (await c.env.PENDING_FILE_UPLOADS.get(
    key,
    'json',
  )) as PendingFile | null;

  if (!kv || Math.ceil(kv.size / CHUNK_SIZE) < parseInt(partNumber)) {
    return c.newResponse(null, 400);
  }

  const contentLength = String(
    kv.size >= parseInt(partNumber) * CHUNK_SIZE
      ? CHUNK_SIZE
      : kv.size % CHUNK_SIZE,
  );

  c.env.PENDING_FILE_UPLOADS.put(
    key,
    JSON.stringify({ ...kv, lastActive: Date.now() }),
  );
  const awsClient = createAwsClient(c.env);
  const signedUrl = await createPresignedPartUploadUrl(awsClient, {
    bucket,
    partNumber: parseInt(partNumber),
    uploadId,
    key,
    contentLength,
  });

  return c.json({ url: signedUrl.url }, 200);
};

export const completeFileUpload: AppRouteHandler<CompleteFileUpload> = async (
  c,
) => {
  const { uploadId, key } = c.req.query();

  const upload = c.env.FILES_BUCKET.resumeMultipartUpload(key, uploadId);
  const parts = c.req.valid('json');

  try {
    await upload.complete(parts);
  } catch (e) {
    console.log(e);
    // todo delete the parts?
    return c.newResponse(null, 400);
  }

  const [{ size: promisedSize }, objectHead] = await Promise.all<[any, any]>([
    c.env.PENDING_FILE_UPLOADS.get(key, 'json'),
    c.env.FILES_BUCKET.head(key),
  ]);
  if (!objectHead?.customMetadata || !promisedSize) {
    // clearly something went wrong, delete object
    await c.env.FILES_BUCKET.delete(key);
    return c.newResponse(null, 400);
  }

  // verify file size
  if (promisedSize !== objectHead.size) {
    await c.env.FILES_BUCKET.delete(key);
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
    await c.env.FILES_BUCKET.delete(key);
    console.log(e);
    return c.newResponse(null, 400);
  }
};

export const abortFileUpload: AppRouteHandler<AbortFileUpload> = async (c) => {
  const { uploadId, key } = c.req.query();

  const session = c.env.FILES_BUCKET.resumeMultipartUpload(key, uploadId);
  await Promise.all([session.abort(), c.env.PENDING_FILE_UPLOADS.delete(key)]);
  return c.newResponse(null, 204);
};

function findCancellableUploadsForSpace(
  newFileSize: number,
  { size: folderSize, maxSize }: Folder,
  pendingFiles: Map<string, PendingFile>,
): Set<string> | null {
  const cutoff = Date.now() - 1.5 * MS_IN_MINUTE;

  const pendingEntries = Array.from(pendingFiles.entries());
  const totalPending = pendingEntries.reduce((sum, [, f]) => sum + f.size, 0);
  const remaining = maxSize - folderSize;

  const overflow = totalPending + newFileSize - remaining;
  if (overflow <= 0) {
    return new Set();
  }

  const cancellable = pendingEntries
    .filter(([, f]) => f.lastActive < cutoff)
    .sort((a, b) => b[1].size - a[1].size);

  let freed = 0;
  const toAbort = new Set<string>();

  for (const [key, file] of cancellable) {
    toAbort.add(key);
    freed += file.size;
    if (freed >= overflow) break;
  }

  if (freed < overflow) return null;

  return toAbort;
}
