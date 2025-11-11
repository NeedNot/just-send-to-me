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
  maxFiles: integer().default(100).notNull(),
  filesDeleted: integer({ mode: 'boolean' }).default(false).notNull(),
  expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
  creatorId: text()
    .references(() => user.id)
    .notNull(),
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
  priceIdMonthly: text('price_id_monthly'),
  priceIdYearly: text('price_id_yearly'),
  maxStoragePerFolder: integer('max_storage').notNull(), //in bytes
  maxFileCountPerFolder: integer('max_file_count').notNull(),
  credits: integer('credits').notNull(),
  stripeId: text('stripe_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text().primaryKey(),
  customerId: text('customer_id').notNull().unique(),
  userId: text('user_id')
    .references(() => user.id)
    .notNull(),
  planId: text('plan_id')
    .references(() => plans.id)
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp_ms' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }),
  lastRenewal: integer('last_renewal', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['active', 'inactive'] }).notNull(),
});
