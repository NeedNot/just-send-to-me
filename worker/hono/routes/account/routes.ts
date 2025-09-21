import { createRoute, z } from '@hono/zod-openapi';
import { folderSchema } from '../../../../shared/schemas';

export const getMyFolders = createRoute({
  method: 'get',
  path: '/account/my-folders',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(folderSchema.omit({ files: true })),
        },
      },
      description: 'All the folders created the account',
    },
    401: {
      description: 'Unauthenticated',
    },
  },
});

export type GetMyFoldersRoute = typeof getMyFolders;
