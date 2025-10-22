import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { eq, sql } from 'drizzle-orm';
import { files, folders } from '../db/schema';
import type { File } from '../../shared/schemas';

export const getFolderById = async (
  db: DrizzleD1Database & { $client: D1Database },
  id: string,
  options?: { withFiles?: boolean },
) => {
  let allFiles: File[] = [];
  const folder = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .get();

  if (!folder) return undefined;

  if (options?.withFiles) {
    allFiles = await db
      .select()
      .from(files)
      .where(eq(files.folderId, id))
      .all();
  }
  return {
    ...folder,
    files: allFiles,
  };
};

export const createFolder = async (
  db: DrizzleD1Database & { $client: D1Database },
  {
    name,
    creatorId,
    expiresAt,
    creditCost,
  }: {
    name: string;
    creatorId: string;
    expiresAt: Date;
    creditCost: number;
  },
) => {
  const res = await db
    .insert(folders)
    .values({
      name,
      maxSize: 1024 ** 3,
      creatorId,
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
