import { createRoute } from '@hono/zod-openapi';
import {
  createFolderSchema,
  folderSchema,
  IdParamSchema,
} from '../../../../shared/schemas';

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

export const getFolder = createRoute({
  method: 'get',
  path: '/folders/{id}',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: folderSchema,
        },
      },
      description: 'Get folder by id',
    },
    404: {
      description: 'Folder not found',
    },
  },
});

export type CreateFolderRoute = typeof createFolder;
export type GetFolderRoute = typeof getFolder;
