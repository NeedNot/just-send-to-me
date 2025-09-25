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

  // todo with foriegn keys could simply skip this and let sql throw the error
  const folder = await getFolderById(db, folderId);
  if (!folder) return c.notFound();

  if (folder.expiresAt < new Date()) {
    return c.json({ message: 'Folder has expired' }, 410);
  }

  if (size + folder.size > folder.maxSize) {
    return c.json({ message: 'File is too large for folder' }, 413);
  }

  const { id, key } = await createFile(db, {
    folderId,
    name,
    userId: folder.creatorId,
    size,
  });

  const client = createAwsClient(c.env);

  const signedUrl = await createPresignedFileUploadUrl(client, {
    bucket,
    key,
    size,
    filename: name,
  });

  return c.json({ id, signedUrl }, 200);
};
