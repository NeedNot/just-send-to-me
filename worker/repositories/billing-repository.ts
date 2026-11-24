import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { plans, subscriptions } from '../db/schema';
import type Stripe from 'stripe';
import { eq, or } from 'drizzle-orm';
import { user } from '../db/auth-schema';

type DB = DrizzleD1Database & { $client: D1Database };

export const isActiveStatus = (status: Stripe.Subscription.Status) =>
  status === 'active' || status === 'trialing';

/**
 * Stores the latest state of a customer's subscription. There is one row per
 * Stripe customer (customer_id is UNIQUE): a returning customer's new
 * subscription replaces the old, canceled one instead of failing the insert.
 */
export async function upsertSubscription(
  db: DB,
  {
    userId,
    planId,
    subscription,
  }: { userId: string; planId: string; subscription: Stripe.Subscription },
) {
  const item = subscription.items.data[0];
  const values = {
    id: subscription.id,
    customerId:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
    userId,
    planId,
    createdAt: new Date(subscription.created * 1000),
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    lastRenewal: new Date(item.current_period_start * 1000),
    status: isActiveStatus(subscription.status)
      ? ('active' as const)
      : ('inactive' as const),
  };
  // everything except the conflict key itself
  const update: Partial<typeof values> = { ...values };
  delete update.customerId;
  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({ target: subscriptions.customerId, set: update });
}

export async function getSubscriptionByCustomerId(db: DB, customerId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.customerId, customerId))
    .get();
}

export async function getUserSubscription(db: DB, userId: string) {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get();
}

export async function getUserCustomerId(db: DB, userId: string) {
  return getUserSubscription(db, userId).then((res) => res?.customerId);
}

export function updateUserPlan(db: DB, userId: string, planId: string) {
  return db.update(user).set({ plan_id: planId }).where(eq(user.id, userId));
}

export const getPlanById = async (db: DB, planId: string) => {
  return db.select().from(plans).where(eq(plans.id, planId)).get();
};

export const getPlanByPriceId = async (db: DB, priceId: string) => {
  return db
    .select()
    .from(plans)
    .where(
      or(eq(plans.priceIdMonthly, priceId), eq(plans.priceIdYearly, priceId)),
    )
    .get();
};
