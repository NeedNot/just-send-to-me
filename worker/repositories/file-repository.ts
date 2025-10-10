import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { files, folders } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';

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

export const insertFile = (
  db: DrizzleD1Database & { $client: D1Database },
  r2Object: R2Object,
) => {
  const id = r2Object.key.split('/')[r2Object.size - 1];
  const { folderId, name } = r2Object.customMetadata ?? {};

  if (!folderId || !name) {
    throw Error('Custom metadata must contain folderId and name');
  }
  return db
    .insert(files)
    .values({ id, folderId, name, key: r2Object.key, size: r2Object.size })
    .returning()
    .get();
};
