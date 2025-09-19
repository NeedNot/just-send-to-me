import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import {
  getFolderById,
  createFolder as repositoryCreateFolder,
} from '../../../repositories/folder-repository';
import { expirationDurations } from '../../../../shared/constants';
import { getUserMetadata } from '../../../repositories/user-metadata-repository';

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const user = c.get('user');
  if (!user) return c.body(null, 401);

  const { name, expiration } = c.req.valid('json');
  const expiresAt = new Date(Date.now() + expirationDurations[expiration]);

  const db = drizzle(c.env.DB);

  const limit = 5;
  const userMeta = await getUserMetadata(db, user.id);

  if (userMeta && userMeta.foldersCreated >= limit) {
    return c.json(
      {
        code: 'FOLDER_LIMIT_REACHED',
        message: 'Please upgrade your account to create more folders',
      },
      403,
    );
  }

  const result = await repositoryCreateFolder(db, {
    name,
    creatorId: user.id,
    expiresAt,
  });
  return c.json(result, 200);
};

export const getFolder: AppRouteHandler<GetFolderRoute> = async (c) => {
  const { id } = c.req.valid('param');

  const db = drizzle(c.env.DB);
  const result = await getFolderById(db, id, { withFiles: true });
  if (!result) return c.notFound();
  return c.json(result, 200);
};
