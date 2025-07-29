import { createRoute } from '@hono/zod-openapi';
import {
  completeFileUploadSchema,
  createFileResponseSchema,
  createFileSchema,
  fileSchema,
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

export const completeFileUpload = createRoute({
  method: 'post',
  path: '/files/upload-complete',
  request: {
    body: {
      content: {
        'application/json': {
          schema: completeFileUploadSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: fileSchema,
        },
      },
      description: 'File uploaded successfully',
    },
    400: {
      description: 'Invalid key or key does not match file',
    },
    404: {
      description: 'Folder or file not found',
    },
    410: {
      description: 'Folder locked and no more files can be uploaded',
    },
    413: {
      description: 'File too large for folder',
    },
  },
});

export type RequestFileUploadRoute = typeof requestFileUpload;
export type CompleteFileUploadRoute = typeof completeFileUpload;
