import { createRoute } from '@hono/zod-openapi';
import {
  myAccountResponseSchema,
  myFoldersResponseSchema,
} from '../../../../shared/schemas';
import { generalRateLimiter } from '../../middleware/rate-limiters';
import { requireUser } from '../../middleware/require-user';

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
  middleware: requireUser,
  method: 'delete',
  path: '/account',
  responses: {
    200: {
      description: 'Account deleted',
    },
    400: {
      description: 'Bad request',
    },
    403: {
      description: 'User still has subscriptions',
    },
  },
});

export type GetMyFoldersRoute = typeof getMyFolders;
export type GetMyAccountRoute = typeof getMyAccount;
export type DeleteMyAccountRoute = typeof deleteMyAccount;
