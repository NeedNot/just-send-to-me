import { describe, expect, it } from 'vitest';
import { getFoldersByCreator } from '../worker/repositories/folder-repository';
import { db, seedFolder, seedUser } from './helpers';
import { MS_IN_DAY } from '../shared/constants';

describe('getFoldersByCreator', () => {
  it('lists active folders newest first, then expired folders newest first', async () => {
    const userId = await seedUser();
    const now = Date.now();
    const seed = (name: string, createdDaysAgo: number, expiresInDays: number) =>
      seedFolder(userId, {
        name,
        createdAt: new Date(now - createdDaysAgo * MS_IN_DAY),
        expiresAt: new Date(now + expiresInDays * MS_IN_DAY),
      });
    await seed('expired-old', 10, -5);
    await seed('active-old', 4, 3);
    await seed('expired-new', 3, -1);
    await seed('active-new', 1, 6);
    await seed('active-mid', 2, 1);

    const names = (await getFoldersByCreator(db(), userId)).map((f) => f.name);
    expect(names).toEqual([
      'active-new',
      'active-mid',
      'active-old',
      'expired-new',
      'expired-old',
    ]);
  });
});
