import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { plans, subscriptions } from '../db/schema';
import type Stripe from 'stripe';
import { eq, or, sql } from 'drizzle-orm';
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
    userId,
    subscription,
  }: { userId: string; subscription: Stripe.Subscription },
) {
  const priceId = subscription.items.data[0].price.id;
  const plan = db
    .select()
    .from(plans)
    .where(
      or(eq(plans.priceIdMonthly, priceId), eq(plans.priceIdYearly, priceId)),
    )
    .as('query');
  const { planId } = await db
    .insert(subscriptions)
    .values({
      id: subscription.id,
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
      status: subscription.status,
      planId: sql`(select ${plan.id} from ${plan})`,
    })
    .onConflictDoNothing({
      target: subscriptions.id,
    })
    .returning({ planId: subscriptions.planId })
    .get();

  await updateUserPlan(db, userId, planId);
}

export async function updateSubscription(
  db: DrizzleD1Database & { $client: D1Database },
  { subscription }: { subscription: Stripe.Subscription },
) {
  const priceId = subscription.items.data[0].price.id;
  const plan = db
    .select()
    .from(plans)
    .where(
      or(eq(plans.priceIdMonthly, priceId), eq(plans.priceIdYearly, priceId)),
    )
    .as('query');
  const { planId, userId } = await db
    .update(subscriptions)
    .set({
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000,
      ),
      lastRenewal: new Date(
        subscription.items.data[0].current_period_start * 1000,
      ),
      status: subscription.status,
      planId: sql`(select ${plan.id} from ${plan})`,
    })
    .where(eq(subscriptions.id, subscription.id))
    .returning({ userId: subscriptions.userId, planId: subscriptions.planId })
    .get();
  console.log(planId, userId);
  const newPlanId = ['active', 'trialing'].includes(subscription.status)
    ? planId
    : 'FREE';
  await updateUserPlan(db, userId, newPlanId);
}

export function updateUserPlan(
  db: DrizzleD1Database & { $client: D1Database },
  userId: string,
  planId: string,
) {
  return db.update(user).set({ plan_id: planId }).where(eq(user.id, userId));
}
