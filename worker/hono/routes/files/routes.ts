import { createRoute } from '@hono/zod-openapi';
import {
  createFileResponseSchema,
  createFileSchema,
} from '../../../../shared/schemas';

export const requestFileUpload = createRoute({
  method: 'post',
  path: '/files/upload-request',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFileSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: createFileResponseSchema,
        },
      },
      description: 'Signed url to upload file to bucket',
    },
    404: {
      description: 'Folder not found',
    },
    410: {
      description: 'Folder locked and no more files can be uploaded',
    },
  },
});

export type RequestFileUploadRoute = typeof requestFileUpload;
