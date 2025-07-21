import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import {
  getFolderById,
  createFolder as repositoryCreateFolder,
} from '../../../repositories/folder-repository';

const MS_IN_WEEK = 60 * 60 * 24 * 7 * 1000;

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const { name, expiration, retention } = c.req.valid('json');

  const expiresAt = new Date(
    Date.now() + MS_IN_WEEK * (expiration === 'week' ? 1 : 2),
  );
  const deletesAt = new Date(
    Date.now() + MS_IN_WEEK * (retention === 'week' ? 1 : 2),
  );

  const db = drizzle(c.env.DB);
  const result = await repositoryCreateFolder(db, {
    name,
    expiresAt,
    deletesAt,
  });
  return c.json(result[0], 200);
};

export const getFolder: AppRouteHandler<GetFolderRoute> = async (c) => {
  const { id } = c.req.valid('param');
  const db = drizzle(c.env.DB);
  const result = await getFolderById(db, id);
  if (!result) return c.notFound();
  return c.json(result, 200);
};
