import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { folders } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const getFolderById = (
  db: DrizzleD1Database & { $client: D1Database },
  id: string,
) => {
  return db.select().from(folders).where(eq(folders.id, id)).get();
};

export const createFolder = (
  db: DrizzleD1Database & { $client: D1Database },
  {
    name,
    expiresAt,
    deletesAt,
  }: { name: string; expiresAt: Date; deletesAt: Date },
) => {
  return db
    .insert(folders)
    .values({
      name,
      maxSize: 1024 ** 3,
      creatorId: '123',
      expiresAt,
      deletesAt,
    })
    .returning()
    .get();
};

export const addFileSizeToFolder = (
  db: DrizzleD1Database & { $client: D1Database },
  { size, folderId }: { size: number; folderId: string },
) => {
  return db
    .update(folders)
    .set({ size: sql`${folders.size} + ${size}` })
    .where(eq(folders.id, folderId))
    .returning()
    .get();
};
