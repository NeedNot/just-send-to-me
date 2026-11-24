import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { eq, sql } from 'drizzle-orm';
import { folders, plans } from '../db/schema';

export const getFolderById = (
  db: DrizzleD1Database & { $client: D1Database },
  id: string,
) => {
  return db.select().from(folders).where(eq(folders.id, id)).get();
};

export const createFolder = async (
  db: DrizzleD1Database & { $client: D1Database },
  {
    name,
    creator,
    expiresAt,
    creditCost,
  }: {
    name: string;
    creator: { id: string; planId: string };
    expiresAt: Date;
    creditCost: number;
  },
) => {
  const subQuery = db
    .select({
      maxFiles: plans.maxFileCountPerFolder,
      maxSize: plans.maxStoragePerFolder,
    })
    .from(plans)
    .where(eq(plans.id, creator.planId))
    .as('subQuery');
  const res = await db
    .insert(folders)
    .values({
      name,
      maxFiles: sql`(select ${subQuery.maxFiles} from ${subQuery})`,
      maxSize: sql`(select ${subQuery.maxSize} from ${subQuery})`,
      creatorId: creator.id,
      expiresAt,
      creditCost,
    })
    .returning()
    .get();

  return res;
};

export const addFileMetaToFolder = (
  db: DrizzleD1Database & { $client: D1Database },
  { size, folderId }: { size: number; folderId: string },
) => {
  return db
    .update(folders)
    .set({
      size: sql`${folders.size} + ${size}`,
      fileCount: sql`${folders.fileCount} + 1`,
    })
    .where(eq(folders.id, folderId))
    .returning()
    .get();
};

export const getFoldersByCreator = async (
  db: DrizzleD1Database & { $client: D1Database },
  creatorId: string,
) => {
  return db
    .select()
    .from(folders)
    .where(eq(folders.creatorId, creatorId))
    .all();
};
