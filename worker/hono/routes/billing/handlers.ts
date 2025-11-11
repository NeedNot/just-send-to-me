import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type {
  CreateCheckoutSessionRoute,
  MySubscriptionRoute,
  StripeBillingPortalRoute,
  StripeWebhookRoute,
} from './routes';
import { Stripe } from 'stripe';
import {
  createSubscription,
  getPlanById,
  getPlanByPriceId,
  getUserSubscription,
  updateSubscription,
  updateUserPlan,
} from '../../../repositories/billing-repository';

// stripe webhook ips
const ALLOWED_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  '13.235.122.149',
  '18.211.135.69',
  '35.154.171.200',
  '52.15.183.38',
  '54.88.130.119',
  '54.88.130.237',
  '54.187.174.169',
  '54.187.205.235',
  '54.187.216.72',
];

export const createCheckoutSession: AppRouteHandler<
  CreateCheckoutSessionRoute
> = async (c) => {
  const user = c.get('user')!;
  const { planId, duration } = c.req.valid('json');

  const db = drizzle(c.env.DB);
  const plan = await getPlanById(db, planId);
  if (!plan) return c.notFound();
  if (!plan.priceIdMonthly || !plan.priceIdYearly)
    return c.newResponse(null, 400);

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: 'https://justsendto.me/success', //todo env
    line_items: [
      {
        price: duration === 'year' ? plan.priceIdYearly : plan.priceIdMonthly,
        quantity: 1,
      },
    ],
    customer_email: user.email,
    metadata: {
      userId: user.id,
    },
  });
  return c.json({ url: session.url }, 200);
};

export const stripeWebHook: AppRouteHandler<StripeWebhookRoute> = async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 3,
    timeout: 3 * 1000,
  });
  const ip = c.req.raw.headers.get('cf-connecting-ip');
  if (!c.env.IS_DEV && !ALLOWED_IPS.includes(ip!)) {
    console.log('ip not allowed');
    return c.newResponse(null, 400);
  }
  const signature = c.req.raw.headers.get('stripe-signature');
  try {
    if (!signature) {
      return c.newResponse(null, 400);
    }
    const body = await c.req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
    );

    const db = drizzle(c.env.DB);
    if (event.type === 'checkout.session.completed') {
      const checkoutEvent = event.data.object as Stripe.Checkout.Session & {
        metadata: {
          userId: string;
        };
      };

      const customerId = checkoutEvent.customer! as string;
      const userId = checkoutEvent.metadata.userId;
      const subscription = await stripe.subscriptions.retrieve(
        checkoutEvent.subscription as string,
      );

      console.log('subscription created');
      const priceId = subscription.items.data[0].price.id;
      const plan = await getPlanByPriceId(db, priceId);
      if (!plan) {
        throw Error(`No plan with priceId ${priceId} found`);
      }
      await createSubscription(db, {
        customerId,
        userId,
        planId: plan.id,
        subscription,
      });
      await updateUserPlan(db, userId, plan.id);
      const stub = c.env.USER_CREDITS_OBJECT.getByName(userId);
      await stub.updateMaxCredits(plan.credits);
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0].price.id;
      const plan = await getPlanByPriceId(db, priceId);
      if (!plan) {
        throw Error(`No plan with priceId ${priceId} found`);
      }
      console.log('subscription updated');
      const sub = await updateSubscription(db, {
        subscription,
        planId: plan.id,
      });
      const newPlanId = ['active', 'trialing'].includes(subscription.status)
        ? plan.id
        : 'FREE';
      await updateUserPlan(db, sub.userId, newPlanId);
      const stub = c.env.USER_CREDITS_OBJECT.getByName(sub.userId);
      stub.updateMaxCredits(plan?.credits || 3);
    }
    return c.newResponse(null, 200);
  } catch (e) {
    console.log(e);
    return c.newResponse(null, 400);
  }
};

export const stripeBillingPortal: AppRouteHandler<
  StripeBillingPortalRoute
> = async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const user = c.get('user')!;
  const sub = await getUserSubscription(drizzle(c.env.DB), user.id);
  if (!sub) return c.json({ error: 'No subscription found' }, 400);
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.customerId,
    return_url: 'https://justsendto.me/account',
  });
  return c.json({ url: session.url }, 200);
};

export const mySubscription: AppRouteHandler<MySubscriptionRoute> = async (
  c,
) => {
  const user = c.get('user')!;
  const sub = await getUserSubscription(drizzle(c.env.DB), user.id);

  if (!sub) {
    return c.json(
      {
        planId: 'FREE',
        createdAt: new Date(Number.MIN_SAFE_INTEGER),
        status: 'active',
        currentPeriodEnd: new Date(Number.MAX_SAFE_INTEGER),
      },
      200,
    );
  }

  // Normalize to the expected response schema: strings for dates and non-null currentPeriodEnd
  const createdAt = new Date(sub.createdAt);
  const currentPeriodEnd = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd)
    : new Date(Number.MAX_SAFE_INTEGER);

  return c.json(
    {
      planId: sub.planId,
      createdAt,
      status: sub.status,
      currentPeriodEnd,
    },
    200,
  );
};
