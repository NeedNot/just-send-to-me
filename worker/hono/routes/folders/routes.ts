import { createRoute } from '@hono/zod-openapi';
import {
  createFolderSchema,
  folderSchema,
  folderViewSchema,
  IdParamSchema,
} from '../../../../shared/schemas';
import { requireUser } from '../../middleware/require-user';

export const createFolder = createRoute({
  middleware: requireUser,
  method: 'post',
  path: '/folders/new',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFolderSchema,
        },
      },
      required: true,
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
    401: {
      description: 'Not authenticated',
    },
    403: {
      description: 'User has reached their folders limit',
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
          schema: folderViewSchema,
        },
      },
      description:
        'Get folder by id. `files` holds only what the caller may see: all files for the owner, their own for an uploader, none otherwise.',
    },
    404: {
      description: 'Folder not found',
    },
    410: {
      description: 'Folder expired',
    },
  },
});

export type CreateFolderRoute = typeof createFolder;
export type GetFolderRoute = typeof getFolder;
