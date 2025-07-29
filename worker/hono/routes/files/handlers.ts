import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import { getFolderById } from '../../../repositories/folder-repository';
import type { CompleteFileUploadRoute, RequestFileUploadRoute } from './routes';
import {
  createPresignedFileUploadUrl,
  getAwsClient,
  getObjectMetadata,
} from '../../../repositories/s3-repository';
import {
  createFile,
  getFileById,
  markFileUploaded,
} from '../../../repositories/file-repository';

const bucket = 'files-bucket';

export const requestFileUpload: AppRouteHandler<
  RequestFileUploadRoute
> = async (c) => {
  const { folderId, name, size } = c.req.valid('json');

  const db = drizzle(c.env.DB);

  // get folder
  const folder = await getFolderById(db, folderId);
  if (!folder) return c.notFound();

  // folder has expired
  if (Date.now() - folder.expiresAt.getTime() > 0) {
    return c.json({ error: 'Link expired' }, 410);
  }

  // todo get current folder size

  // insert file into d1
  const userId = '123';
  const { id, key } = await createFile(db, { folderId, name, userId, size });

  // create signed url
  const client = getAwsClient();
  const signedUrl = await createPresignedFileUploadUrl(client, {
    bucket,
    key,
    size,
  });

  return c.json({ id, key, signedUrl }, 200);
};

export const completeFileUpload: AppRouteHandler<
  CompleteFileUploadRoute
> = async (c) => {
  const { folderId, id, key } = c.req.valid('json');

  // get file
  const db = drizzle(c.env.DB);
  const file = await getFileById(db, { folderId, id });
  if (!file) return c.notFound();
  if (file.uploaded) return c.json(file, 200);
  if (file.key !== key) return c.json({ error: 'Invalid key' }, 400);

  // check if file exists in r2
  const client = getAwsClient();
  const metadata = await getObjectMetadata(client, {
    bucket,
    key,
  });
  if (!metadata) return c.notFound();

  // mark file as uploaded
  const updatedFile = await markFileUploaded(db, { folderId, id });
  //todo update folder size

  return c.json(updatedFile, 200);
};
