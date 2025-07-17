import { drizzle } from 'drizzle-orm/d1/driver';
import { folders } from '../../../db/schema';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import { eq } from 'drizzle-orm';

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
  const result = await db
    .insert(folders)
    .values({
      name,
      maxSize: 1024 ** 3,
      creatorId: '123',
      expiresAt,
      deletesAt,
    })
    .returning();
  return c.json(result[0], 200);
};

export const getFolder: AppRouteHandler<GetFolderRoute> = async (c) => {
  const { id } = c.req.valid('param');
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .get();
  if (!result) return c.notFound();
  return c.json(result, 200);
};
