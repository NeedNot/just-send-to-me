import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import { getFolderById } from '../../../repositories/folder-repository';
import type {
  AbortFileUpload,
  CompleteFileUpload,
  GetFilePartUploadUrl,
  UploadNewFileRoute,
} from './routes';

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

  if (folder.fileCount + 1 > folder.maxFiles) {
    return c.json({ message: 'Folder has too many files' }, 413);
  }

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

  try {
    const res = await stub.startNewUpload(
      { name, size },
      folderId,
      folder.creatorId,
    );
    return c.json(res, 200);
  } catch (e: any) {
    if (e.message === 'TOO_MANY_FILES') {
      return c.json({ message: 'Folder has too many files' }, 413);
    }
    if (e.message === 'NOT_ENOUGH_SPACE') {
      return c.json({ message: 'File is too large for folder' }, 413);
    }
    console.log(e);
  }

  return c.newResponse(null, 500);
};

export const uploadFilePart: AppRouteHandler<GetFilePartUploadUrl> = async (
  c,
) => {
  const { partNumber } = c.req.param();
  const { uploadId, key } = c.req.query();

  const folderId = key.split('/')[1];

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(folderId);
  try {
    const url = await stub.getPartUploadUrl(key, uploadId, partNumber);
    return c.json({ url }, 200);
  } catch (e) {
    console.log(e);
    return c.newResponse(null, 400);
  }
};

export const completeFileUpload: AppRouteHandler<CompleteFileUpload> = async (
  c,
) => {
  const { uploadId, key } = c.req.query();
  const parts = c.req.valid('json');

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(key.split('/')[1]);
  const res = await stub.completeUpload(key, uploadId, parts);

  if (!res) {
    return c.newResponse(null, 400);
  }
  return c.json(res, 200);
};

export const abortFileUpload: AppRouteHandler<AbortFileUpload> = async (c) => {
  const { uploadId, key } = c.req.query();

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(key.split('/')[1]);
  await stub.abortUpload(key, uploadId);
  return c.newResponse(null, 204);
};
