import { createRoute, z } from '@hono/zod-openapi';
import {
  confirmCheckoutSessionResponseSchema,
  confirmCheckoutSessionSchema,
  createCheckoutSessionResponseSchema,
  createCheckoutSessionSchema,
  createPortalSessionResponseSchema,
  subscriptionResponseSchema,
} from '../../../../shared/schemas';
import { requireUser } from '../../middleware/require-user';

export const createCheckoutSession = createRoute({
  method: 'post',
  middleware: requireUser,
  path: '/billing/checkout',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCheckoutSessionSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: createCheckoutSessionResponseSchema,
        },
      },
      description: 'Session url',
    },
    404: {
      description: 'Not found',
    },
    400: {
      description: 'Bad request',
    },
    409: {
      description: 'User already has an active subscription',
    },
  },
});

// Called by the success page so the plan is active as soon as the user lands
// there, without waiting for (or depending on) the webhook.
export const confirmCheckoutSession = createRoute({
  method: 'post',
  middleware: requireUser,
  path: '/billing/checkout/confirm',
  request: {
    body: {
      content: {
        'application/json': {
          schema: confirmCheckoutSessionSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: confirmCheckoutSessionResponseSchema,
        },
      },
      description: "The user's plan after syncing the checkout's subscription",
    },
    404: {
      description: 'No subscription checkout for this user',
    },
    409: {
      description: 'Checkout not finalised yet; retry shortly',
    },
  },
});

export const stripeWebhook = createRoute({
  method: 'post',
  path: '/billing/webhook',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Event processed or ignored',
    },
    400: {
      description: 'Missing or invalid Stripe signature',
    },
    500: {
      description: 'Processing failed; Stripe will retry',
    },
  },
});

export const stripeBillingPortal = createRoute({
  middleware: requireUser,
  method: 'get',
  path: '/billing/portal',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: createPortalSessionResponseSchema,
        },
      },
      description: 'Success',
    },
    400: {
      description: 'Bad request',
    },
  },
});

export const getSubscription = createRoute({
  middleware: requireUser,
  method: 'get',
  path: '/billing/subscription',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: subscriptionResponseSchema,
        },
      },
      description: "the user's subscription",
    },
  },
});

export type CreateCheckoutSessionRoute = typeof createCheckoutSession;
export type ConfirmCheckoutSessionRoute = typeof confirmCheckoutSession;
export type StripeWebhookRoute = typeof stripeWebhook;
export type StripeBillingPortalRoute = typeof stripeBillingPortal;
export type GetSubscriptionRoute = typeof getSubscription;
