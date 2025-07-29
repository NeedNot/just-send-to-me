import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { files } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const getFileById = (
  db: DrizzleD1Database & { $client: D1Database },
  { id, folderId }: { id: string; folderId: string },
) => {
  return db
    .select()
    .from(files)
    .where(and(eq(files.folderId, folderId), eq(files.id, id)))
    .get();
};

export const createFile = (
  db: DrizzleD1Database & { $client: D1Database },
  {
    folderId,
    name,
    userId,
    size,
  }: {
    folderId: string;
    name: string;
    userId: string;
    size: number;
  },
) => {
  const id = createId();
  const key = `${userId}/${folderId}/${id}`;
  return db
    .insert(files)
    .values({ id, folderId, name, key, size })
    .returning()
    .get();
};

export const markFileUploaded = (
  db: DrizzleD1Database & { $client: D1Database },
  { folderId, id }: { folderId: string; id: string },
) => {
  return db
    .update(files)
    .set({ uploaded: true })
    .where(and(eq(files.folderId, folderId), eq(files.id, id)))
    .returning()
    .get();
};
