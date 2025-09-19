import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { user_metadata } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const createUserMetadata = (
  db: DrizzleD1Database & { $client: D1Database },
  userId: string,
) => {
  return db.insert(user_metadata).values({ userId });
};

export const getUserMetadata = (
  db: DrizzleD1Database & { $client: D1Database },
  userId: string,
) => {
  return db
    .select()
    .from(user_metadata)
    .where(eq(user_metadata.userId, userId))
    .get();
};
