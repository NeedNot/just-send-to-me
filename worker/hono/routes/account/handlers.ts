import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMyFoldersRoute } from './routes';
import { getFoldersByCreator } from '../../../repositories/folder-repository';
import type { Folder } from '../../../../shared/schemas';

export const getMyFolders: AppRouteHandler<GetMyFoldersRoute> = async (c) => {
  const user = c.get('user')!;

  const db = drizzle(c.env.DB);
  const allFolders = await getFoldersByCreator(db, user.id);
  const folders: Folder[] = [];
  const expiredFolders: Folder[] = [];

  for (const folder of allFolders) {
    if (folder.expiresAt > new Date()) {
      folders.push(folder);
    } else {
      expiredFolders.push(folder);
    }
  }

  const maxFolders = 3;

  return c.json({ folders, expiredFolders, maxFolders }, 200);
};
