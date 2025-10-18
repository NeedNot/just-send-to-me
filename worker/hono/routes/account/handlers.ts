import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMyAccountRoute, GetMyFoldersRoute } from './routes';
import {
  getEffectiveQuotaFolders,
  getFoldersByCreator,
} from '../../../repositories/folder-repository';
import type { Folder } from '../../../../shared/schemas';
import { getPlanById } from '../../../repositories/plan-repository';

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

  return c.json({ folders, expiredFolders }, 200);
};

export const getMyAccount: AppRouteHandler<GetMyAccountRoute> = async (c) => {
  const user: any = c.get('user')!;

  const db = drizzle(c.env.DB);
  const plan = await getPlanById(db, user.planId);
  const usedFolders = await getEffectiveQuotaFolders(db, user.id);

  return c.json(
    {
      name: user.name,
      email: user.email,
      foldersUsed: usedFolders.length,
      plan: {
        id: plan?.id ?? '',
        name: plan?.name ?? 'Free',
        maxFolders: plan?.maxFolderCount ?? 3,
      },
    },
    200,
  );
};
