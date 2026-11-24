import { Stripe } from 'stripe';
import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import {
  getPlanById,
  getPlanByPriceId,
  getSubscriptionByCustomerId,
  isActiveStatus,
  updateUserPlan,
  upsertSubscription,
} from '../repositories/billing-repository';

type DB = DrizzleD1Database & { $client: D1Database };

/**
 * Pinned explicitly (it matches stripe-node 19.x's default) so a library
 * upgrade can't silently change request/response shapes. The webhook
 * endpoint's version in the Stripe dashboard should match it: event payloads
 * use the endpoint's version, and this code reads clover-era fields such as
 * items.data[0].current_period_end.
 */
export const STRIPE_API_VERSION = '2025-10-29.clover' as const;

export function stripeClient(env: Env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
}

export type SyncResult =
  | { status: 'synced'; userId: string; planId: string; active: boolean }
  | { status: 'ignored'; reason: string };

/**
 * Makes the app's entitlements match a Stripe subscription: the subscription
 * row, user.plan_id and the credit allowance.
 *
 * Callers pass a subscription freshly retrieved from the API, not the event
 * payload, so out-of-order or re-delivered events can't apply stale state,
 * and processing the same event twice is harmless.
 */
export async function syncSubscription(
  db: DB,
  env: Env,
  subscription: Stripe.Subscription,
  { userId: userIdHint }: { userId?: string } = {},
): Promise<SyncResult> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const existing = await getSubscriptionByCustomerId(db, customerId);
  const userId =
    subscription.metadata?.userId || userIdHint || existing?.userId;
  if (!userId) {
    return { status: 'ignored', reason: `no user for ${subscription.id}` };
  }

  const active = isActiveStatus(subscription.status);
  // An old subscription ending must not downgrade a customer who has since
  // started a new one.
  if (!active && existing && existing.id !== subscription.id) {
    return {
      status: 'ignored',
      reason: `stale ${subscription.id}; current is ${existing.id}`,
    };
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? await getPlanByPriceId(db, priceId) : undefined;
  if (!plan) {
    // a misconfigured price must fail loudly (500) so Stripe retries it
    throw new Error(`No plan with priceId ${priceId}`);
  }

  await upsertSubscription(db, { userId, planId: plan.id, subscription });

  const entitledPlan = active ? plan : await getPlanById(db, 'FREE');
  const entitledPlanId = entitledPlan?.id ?? 'FREE';
  await updateUserPlan(db, userId, entitledPlanId);
  await env.USER_CREDITS_OBJECT.getByName(userId).updateMaxCredits(
    entitledPlan?.credits ?? 3,
  );

  return { status: 'synced', userId, planId: entitledPlanId, active };
}
