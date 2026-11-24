import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { files, folders } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import type { Viewer } from '../lib/folder-access';

type DB = DrizzleD1Database & { $client: D1Database };
type FileRow = typeof files.$inferSelect;

export const insertFile = (
  db: DB,
  r2Object: R2Object,
  uploaderId: string | null = null,
) => {
  const id = r2Object.key.split('/').at(-1);
  const { folderId, name } = r2Object.customMetadata ?? {};

  if (!folderId || !name) {
    throw Error('Custom metadata must contain folderId and name');
  }
  return db
    .insert(files)
    .values({
      id,
      folderId,
      name,
      key: r2Object.key,
      size: r2Object.size,
      uploaderId,
    })
    .returning()
    .get();
};

/**
 * The files of a folder that `viewer` may see: all of them for the owner,
 * only their own for an uploader, none for anyone else.
 */
export const listFilesForViewer = async (
  db: DB,
  folderId: string,
  viewer: Viewer,
) => {
  if (viewer.role === 'visitor') return [];
  return db
    .select()
    .from(files)
    .where(
      viewer.role === 'owner'
        ? eq(files.folderId, folderId)
        : and(
            eq(files.folderId, folderId),
            eq(files.uploaderId, viewer.uploaderId),
          ),
    )
    .orderBy(files.createdAt)
    .all();
};

/** A file plus the folder fields needed to authorize access to it. */
export const getFileWithFolder = (db: DB, fileId: string) => {
  return db
    .select({
      file: files,
      folder: { creatorId: folders.creatorId, expiresAt: folders.expiresAt },
    })
    .from(files)
    .innerJoin(folders, eq(files.folderId, folders.id))
    .where(eq(files.id, fileId))
    .get();
};

/** The API shape of a file: never the R2 key or the uploader id. */
export const toPublicFile = (file: FileRow) => ({
  id: file.id,
  folderId: file.folderId,
  name: file.name,
  size: file.size,
  createdAt: file.createdAt,
});
