import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateCheckoutSessionRoute, StripeWebhookRoute } from './routes';
import { Stripe } from 'stripe';
import {
  createSubscription,
  getPlanById,
  getPlanByPriceId,
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
  const { planId, interval } = c.req.valid('json');

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
        price: interval === 'year' ? plan.priceIdYearly : plan.priceIdMonthly,
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

      const userId = checkoutEvent.metadata.userId;
      const subscription = await stripe.subscriptions.retrieve(
        checkoutEvent.subscription as string,
      );

      console.log('subscription created');
      const priceId = subscription.items.data[0].price.id
      const plan = await getPlanByPriceId(db, priceId)
      if (!plan) {
        throw Error(`No plan with priceId ${priceId} found`)
      }
      await createSubscription(db, { userId, planId: plan.id, subscription });
      await updateUserPlan(db, userId, plan.id);
      const stub = c.env.USER_CREDITS_OBJECT.getByName(userId)
      await stub.updateMaxCredits(plan.credits)
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0].price.id
      const plan = await getPlanByPriceId(db, priceId)
      if (!plan) {
        throw Error(`No plan with priceId ${priceId} found`)
      }
      console.log('subscription updated');
      const sub = await updateSubscription(db, { subscription, planId: plan.id });
      const newPlanId = ['active', 'trialing'].includes(subscription.status)
        ? sub.userId
        : 'FREE';
      await updateUserPlan(db, sub.userId, newPlanId);
      const stub = c.env.USER_CREDITS_OBJECT.getByName(sub.userId);
      stub.updateMaxCredits(plan?.credits || 3)
    }
    return c.newResponse(null, 200);
  } catch (e) {
    console.log(e);
    return c.newResponse(null, 400);
  }
};
