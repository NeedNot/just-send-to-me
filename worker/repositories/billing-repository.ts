import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { plans, subscriptions } from '../db/schema';
import type Stripe from 'stripe';
import { and, eq, or } from 'drizzle-orm';
import { user } from '../db/auth-schema';

/**
 * Creates a new subscription in the database. Does nothing if the subscription already exists.
 *
 * @param db - The Drizzle database client.
 * @param params - An object containing the subscription data.
 * @param params.userId - The ID of the user who owns the subscription.
 * @param params.subscription - The Stripe subscription object.
 *
 * @returns A promise that resolves when the subscription has been created in the database.
 *
 * @example
 * const subscription = await stripe.subscriptions.retrieve('si_1234567890');
 * const result = await createSubscription(db, {
 *   userId: 'user_1234567890',
 *   subscription,
 * });
 */
export async function createSubscription(
  db: DrizzleD1Database & { $client: D1Database },
  {
    customerId,
    userId,
    planId,
    subscription,
  }: {
    customerId: string;
    userId: string;
    planId: string;
    subscription: Stripe.Subscription;
  },
) {
  await db
    .insert(subscriptions)
    .values({
      id: subscription.id,
      customerId,
      createdAt: new Date(subscription.created * 1000),
      userId,
      currentPeriodStart: new Date(
        subscription.items.data[0].current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000,
      ),
      lastRenewal: new Date(
        subscription.items.data[0].current_period_start * 1000,
      ),
      status: ['active', 'trialing'].includes(subscription.status)
        ? 'active'
        : 'inactive',
      planId,
    })
    .onConflictDoNothing({
      target: subscriptions.id,
    })
    .get();
}

export async function updateSubscription(
  db: DrizzleD1Database & { $client: D1Database },
  {
    subscription,
    planId,
  }: { subscription: Stripe.Subscription; planId: string },
) {
  const sub = await db
    .update(subscriptions)
    .set({
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000,
      ),
      lastRenewal: new Date(
        subscription.items.data[0].current_period_start * 1000,
      ),
      status: ['active', 'trialing'].includes(subscription.status)
        ? 'active'
        : 'inactive',
      planId,
    })
    .where(eq(subscriptions.id, subscription.id))
    .returning({ userId: subscriptions.userId })
    .get();

  return sub;
}

export async function getUserSubscription(
  db: DrizzleD1Database & { $client: D1Database },
  userId: string,
) {
  return db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')),
    )
    .get();
}

export function updateUserPlan(
  db: DrizzleD1Database & { $client: D1Database },
  userId: string,
  planId: string,
) {
  return db.update(user).set({ plan_id: planId }).where(eq(user.id, userId));
}

export const getPlanById = async (
  db: DrizzleD1Database & { $client: D1Database },
  planId: string,
) => {
  return db.select().from(plans).where(eq(plans.id, planId)).get();
};

export const getPlanByPriceId = async (
  db: DrizzleD1Database & { $client: D1Database },
  priceId: string,
) => {
  return db
    .select()
    .from(plans)
    .where(
      or(eq(plans.priceIdMonthly, priceId), eq(plans.priceIdYearly, priceId)),
    )
    .get();
};
