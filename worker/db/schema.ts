import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema';

// todo rename column names to snake case

export const folders = sqliteTable('folders', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text({ length: 128 }).notNull(),
  maxSize: integer().notNull(),
  size: integer().default(0).notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  creatorId: text().notNull(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const files = sqliteTable('files', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  folderId: text()
    .references(() => folders.id)
    .notNull(),
  name: text({ length: 255 }).notNull(),
  key: text().notNull(),
  size: integer().notNull(),
  uploaded: integer({ mode: 'boolean' }).notNull().default(false),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const user_metadata = sqliteTable('user_metadata', {
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  downloads: integer().notNull().default(0),
  foldersCreated: integer('folders_created').notNull().default(0),
});
