import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

export const folders = sqliteTable('folders', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text({ length: 128 }).notNull(),
  maxSize: integer().notNull(),
  size: integer().default(0).notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(), //todo rename to "locksAt"?
  deletesAt: integer({ mode: 'timestamp_ms' }).notNull(),
  creatorId: text().notNull(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const files = sqliteTable('files', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  folderId: text().notNull(),
  name: text({ length: 255 }).notNull(),
  key: text().notNull(),
  size: integer().notNull(),
  uploaded: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
