import { createRoute, z } from '@hono/zod-openapi';
import {
  createCheckoutSessionResponseSchema,
  createCheckoutSessionSchema,
} from '../../../../shared/schemas';
import { requireUser } from '../../middleware/require-user';

export const createCheckoutSession = createRoute({
  method: 'post',
  middleware: requireUser,
  path: '/billing/create-checkout-session',
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
      description: 'Success',
    },
  },
});

export const stripeBillingPortal = createRoute({
  middleware: requireUser,
  method: 'get',
  path: '/billing/portal',
  responses: {
    200: {
      description: 'Success',
    },
  },
});

export type CreateCheckoutSessionRoute = typeof createCheckoutSession;
export type StripeWebhookRoute = typeof stripeWebhook;
export type StripeBillingPortalRoute = typeof stripeBillingPortal;
