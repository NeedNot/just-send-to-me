import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { plans } from '../db/schema';

export const getPlanById = async (
  db: DrizzleD1Database & { $client: D1Database },
  planId: string,
) => {
  return db.select().from(plans).where(eq(plans.id, planId)).get();
};
