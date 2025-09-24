import { createRoute } from '@hono/zod-openapi';
import { myFoldersResponseSchema } from '../../../../shared/schemas';

export const getMyFolders = createRoute({
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

export type GetMyFoldersRoute = typeof getMyFolders;
