import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import {
  getEffectiveQuotaFolders,
  getFolderById,
  createFolder as repositoryCreateFolder,
} from '../../../repositories/folder-repository';
import { EXPIRATION_DURATIONS, MS_IN_DAY } from '../../../../shared/constants';

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const user = c.get('user');
  if (!user) return c.body(null, 401);

  const { name, expiration } = c.req.valid('json');
  const duration = EXPIRATION_DURATIONS[expiration];
  const expiresAt = new Date(Date.now() + duration);
  const effectiveQuotaTill = new Date(
    Date.now() + Math.min(MS_IN_DAY * 30, duration * 15),
  );

  const db = drizzle(c.env.DB);

  const limit = 3;
  const quotaFolders = await getEffectiveQuotaFolders(db, user.id);

  if (quotaFolders.length >= limit) {
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
    effectiveQuotaTill,
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
