import { createRoute, z } from '@hono/zod-openapi';

export const giftCredits = createRoute({
  path: '/admin/gift-credits',
  method: 'post',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string().min(1),
            credits: z.number(),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export type GiftCreditsRoute = typeof giftCredits;
