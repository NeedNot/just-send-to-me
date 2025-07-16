import { createRoute } from '@hono/zod-openapi';
import { createFolderSchema, folderSchema } from '../../../../shared/schemas';

export const createFolder = createRoute({
  method: 'post',
  path: '/folders/new',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFolderSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: folderSchema,
        },
      },
      description: 'Create new folder',
    },
  },
});

export type CreateFolderRoute = typeof createFolder;
