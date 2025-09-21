import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMyFoldersRoute } from './routes';
import { getFoldersByCreator } from '../../../repositories/folder-repository';

export const getMyFolders: AppRouteHandler<GetMyFoldersRoute> = async (c) => {
  const user = c.get('user')!;

  const db = drizzle(c.env.DB);
  const folders = await getFoldersByCreator(db, user.id);
  return c.json(folders, 200);
};
