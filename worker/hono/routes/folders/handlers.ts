import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import {
  getFolderById,
  createFolder as repositoryCreateFolder,
} from '../../../repositories/folder-repository';
import { expirationDurations } from '../../../../shared/constants';

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const { name, expiration } = c.req.valid('json');

  const expiresAt = new Date(Date.now() + expirationDurations[expiration]);

  const db = drizzle(c.env.DB);
  const result = await repositoryCreateFolder(db, {
    name,
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
