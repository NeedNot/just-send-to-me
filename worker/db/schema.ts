import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema';

// todo rename column names to snake case

export const folders = sqliteTable('folders', {
  id: text()
    .$defaultFn(() => createId().slice(0, 6))
    .primaryKey(),
  name: text({ length: 128 }).notNull(),
  maxSize: integer().notNull(),
  size: integer().default(0).notNull(),
  fileCount: integer().default(0).notNull(),
  filesDeleted: integer({ mode: 'boolean' }).default(false).notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  creatorId: text().references(() => user.id).notNull(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  creditCost: integer('credit_cost').default(1).notNull(),
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
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const plans = sqliteTable('plans', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text({ length: 128 }).notNull(),
  priceMonthly: integer('price_monthly').notNull(), // in cents
  priceYearly: integer('price_yearly').notNull(), // in cents
  maxStoragePerFolder: integer('max_storage').notNull(), //in bytes
  maxFileCountPerFolder: integer('max_file_count').notNull(),
  credits: integer('credits').notNull(),
  stripePriceId: text('stripe_price_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const userSubscriptions = sqliteTable('user_subscriptions', {
  id: text()
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text()
    .references(() => user.id)
    .notNull(),
  planId: text()
    .references(() => plans.id)
    .notNull(),
  status: text('status', {
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired'],
  }).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  start: integer({ mode: 'timestamp_ms' }).notNull(),
  end: integer({ mode: 'timestamp_ms' }).notNull(),
  cancelAt: integer('cancel_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});
