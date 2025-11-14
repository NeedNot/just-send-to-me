import { createRoute, z } from '@hono/zod-openapi';
import {
  myAccountResponseSchema,
  myFoldersResponseSchema,
} from '../../../../shared/schemas';
import { generalRateLimiter } from '../../middleware/rate-limiters';

export const getMyFolders = createRoute({
  middleware: generalRateLimiter,
  method: 'get',
  path: '/account/my-folders',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: myFoldersResponseSchema,
        },
      },
      description: 'All the folders created by the account',
    },
    401: {
      description: 'Unauthenticated',
    },
  },
});

export const getMyAccount = createRoute({
  method: 'get',
  path: '/account',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: myAccountResponseSchema,
        },
      },
      description: 'Everything about the account',
    },
    401: {
      description: 'Unauthenticated',
    },
  },
});

export const deleteMyAccount = createRoute({
  method: 'delete',
  path: '/account',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            password: z.string().min(1),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            deletingAt: z.date(),
          }),
        },
      },
      description: 'Account deleted',
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Incorrect password',
    },
    403: {
      description: 'User still has subscriptions',
    },
  },
});

export const restoreAccount = createRoute({
  method: 'post',
  path: '/account/restore',
  responses: {
    200: {
      description: 'Account restored',
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Unauthenticated',
    },
  },
});

export type GetMyFoldersRoute = typeof getMyFolders;
export type GetMyAccountRoute = typeof getMyAccount;
export type DeleteMyAccountRoute = typeof deleteMyAccount;
export type RestoreAccountRoute = typeof restoreAccount;
