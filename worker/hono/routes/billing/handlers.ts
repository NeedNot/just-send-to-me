import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type {
  ConfirmCheckoutSessionRoute,
  CreateCheckoutSessionRoute,
  GetSubscriptionRoute,
  StripeBillingPortalRoute,
  StripeWebhookRoute,
} from './routes';
import type { Stripe } from 'stripe';
import {
  getPlanById,
  getUserSubscription,
} from '../../../repositories/billing-repository';
import {
  confirmCheckoutSession as confirmCheckout,
  stripeClient,
  syncSubscription,
} from '../../../lib/billing';

// Events that can change a user's entitlement. Everything else is
// acknowledged with 200 and ignored.
const SUBSCRIPTION_EVENTS = new Set<Stripe.Event['type']>([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);

export const createCheckoutSession: AppRouteHandler<
  CreateCheckoutSessionRoute
> = async (c) => {
  const user = c.get('user')!;
  const { planId, duration } = c.req.valid('json');

  const db = drizzle(c.env.DB);
  const plan = await getPlanById(db, planId);
  if (!plan) return c.notFound();
  const price = duration === 'year' ? plan.priceIdYearly : plan.priceIdMonthly;
  if (!price) return c.newResponse(null, 400);

  const existing = await getUserSubscription(db, user.id);
  if (existing?.status === 'active') {
    // a second checkout would create a second, parallel subscription
    return c.json(
      { error: 'You already have a subscription. Manage it in billing.' },
      409,
    );
  }

  const stripe = stripeClient(c.env);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    // Stripe rejects customer + customer_email together, which broke
    // checkout for every returning customer
    ...(existing?.customerId
      ? { customer: existing.customerId }
      : { customer_email: user.email }),
    client_reference_id: user.id,
    metadata: { userId: user.id },
    // copied onto the subscription so every subscription event can be
    // attributed to the user, whatever order the events arrive in
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${c.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${c.env.URL}/account/subscription`,
  });
  return c.json({ url: session.url! }, 200);
};

export const confirmCheckoutSession: AppRouteHandler<
  ConfirmCheckoutSessionRoute
> = async (c) => {
  const user = c.get('user')!;
  const { sessionId } = c.req.valid('json');
  const result = await confirmCheckout(
    drizzle(c.env.DB),
    c.env,
    stripeClient(c.env),
    { userId: user.id, sessionId },
  );
  if (result.status === 'pending') {
    console.log('checkout confirm pending', sessionId, result.reason);
    return c.json({ error: 'Checkout is still being finalised' }, 409);
  }
  if (result.status !== 'synced') {
    if (result.status === 'ignored') {
      console.log('checkout confirm ignored', sessionId, result.reason);
    }
    return c.json({ error: 'Checkout not found' }, 404);
  }
  return c.json({ planId: result.planId, active: result.active }, 200);
};

export const stripeWebHook: AppRouteHandler<StripeWebhookRoute> = async (c) => {
  // No source-IP allowlist: the hard-coded list was missing 3 of Stripe's 15
  // current webhook IPs, so those deliveries were rejected. The signature
  // check below (over the raw body) is the authentication.
  const signature = c.req.header('stripe-signature');
  if (!signature) return c.newResponse(null, 400);

  const stripe = stripeClient(c.env);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await c.req.text(),
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.log('Stripe webhook signature verification failed', e);
    return c.newResponse(null, 400);
  }

  const db = drizzle(c.env.DB);
  try {
    let subscriptionId: string | undefined;
    let userId: string | undefined;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.mode !== 'subscription' || !session.subscription) {
        return c.newResponse(null, 200);
      }
      subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
      userId =
        session.metadata?.userId ?? session.client_reference_id ?? undefined;
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    } else {
      return c.newResponse(null, 200);
    }

    // re-read the current state: makes processing order-independent and
    // idempotent (a retry or duplicate delivery re-applies the same state)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const result = await syncSubscription(db, c.env, subscription, { userId });
    console.log('stripe webhook', event.type, event.id, JSON.stringify(result));
    return c.newResponse(null, 200);
  } catch (e) {
    // 5xx so Stripe retries with backoff
    console.log('Stripe webhook processing failed', event.type, event.id, e);
    return c.newResponse(null, 500);
  }
};

export const stripeBillingPortal: AppRouteHandler<
  StripeBillingPortalRoute
> = async (c) => {
  const user = c.get('user')!;
  const sub = await getUserSubscription(drizzle(c.env.DB), user.id);
  if (!sub?.customerId) return c.json({ error: 'No subscription found' }, 400);
  const session = await stripeClient(c.env).billingPortal.sessions.create({
    customer: sub.customerId,
    return_url: `${c.env.URL}/account/subscription`,
  });
  return c.json({ url: session.url }, 200);
};

export const getSubscription: AppRouteHandler<GetSubscriptionRoute> = async (
  c,
) => {
  const user = c.get('user')!;
  const db = drizzle(c.env.DB);
  const sub = await getUserSubscription(db, user.id);

  const free = {
    planId: 'FREE',
    createdAt: new Date(Number.MIN_SAFE_INTEGER),
    status: 'active' as const,
    currentPeriodEnd: new Date(Number.MAX_SAFE_INTEGER),
    cancelsAtPeriodEnd: false,
    existingCustomer: !!sub?.customerId,
  };
  if (sub?.status !== 'active') return c.json(free, 200);

  const stripeSub = await stripeClient(c.env).subscriptions.retrieve(sub.id);
  if (stripeSub.status !== 'active' && stripeSub.status !== 'trialing') {
    // a missed or failed webhook left us out of date: heal it now
    await syncSubscription(db, c.env, stripeSub, { userId: user.id });
    return c.json(free, 200);
  }

  return c.json(
    {
      planId: sub.planId,
      createdAt: new Date(sub.createdAt),
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : new Date(Number.MAX_SAFE_INTEGER),
      cancelsAtPeriodEnd:
        stripeSub.cancel_at_period_end || !!stripeSub.cancel_at,
      existingCustomer: true,
    },
    200,
  );
};
