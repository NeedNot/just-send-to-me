import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import { getFolderById } from '../../../repositories/folder-repository';
import type { RequestFileUploadRoute } from './routes';
import { createPresignedFileUploadUrl } from '../../../repositories/s3-repository';
import { createFile } from '../../../repositories/file-repository';
import { createAwsClient } from '../../../lib/s3';

const bucket = 'files-bucket';

export const requestFileUpload: AppRouteHandler<
  RequestFileUploadRoute
> = async (c) => {
  const { folderId, name, size } = c.req.valid('json');

  const db = drizzle(c.env.DB);

  // get folder
  // todo with foriegn keys could simply ignore this and let sql throw the error
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

  const client = createAwsClient(c.env);

  // create signed url
  const signedUrl = await createPresignedFileUploadUrl(client, {
    bucket,
    key,
    size,
    filename: name,
  });

  return c.json({ id, signedUrl }, 200);
};