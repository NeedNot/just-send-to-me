import { createRoute, z } from '@hono/zod-openapi';
import {
  R2UploadedPartSchema,
  uploadFileResponseSchema,
  uploadNewFileSchema,
} from '../../../../shared/schemas';

export const uploadNewFile = createRoute({
  method: 'post',
  path: '/files/upload/new',
  request: {
    body: {
      content: {
        'application/json': {
          schema: uploadNewFileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: uploadFileResponseSchema,
        },
      },
      description: 'Upload Id',
    },
    404: {
      description: 'Folder not found',
    },
    410: {
      description: 'Folder locked and no more files can be uploaded',
    },
    413: {
      description: 'File size exceeds remaining folder space',
    },
    429: {
      description: 'Too many concurrent files being uploaded',
    },
  },
});

export const getFilePartUploadUrl = createRoute({
  method: 'get',
  path: '/files/upload/part/:partNumber',
  request: {
    query: z.object({
      uploadId: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: 'uploadId',
            in: 'query',
          },
        }),
      key: z
        .string()
        .min(1)
        .openapi({ param: { name: 'key', in: 'query' } }),
    }),
    params: z.object({
      partNumber: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: 'partNumber',
            in: 'path',
          },
        }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z
            .object({ url: z.string() })
            .openapi({ type: 'object', required: ['url'] }),
        },
      },
      description: 'Signed url for uploading the part',
    },
    400: {
      description: 'Bad request',
    },
  },
});

export const abortUpload = createRoute({
  method: 'post',
  path: '/files/upload/:uploadId/abort',
  request: {},
  responses: {},
});

export const completeFileUpload = createRoute({
  method: 'post',
  path: '/files/upload/complete',
  request: {
    query: z.object({
      uploadId: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: 'uploadId',
            in: 'query',
          },
        }),
      key: z
        .string()
        .min(1)
        .openapi({
          param: {
            name: 'key',
            in: 'query',
          },
        }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.array(R2UploadedPartSchema),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'File upload successfully completed',
    },
    400: {
      description: 'Bad request',
    },
  },
});

export type UploadNewFileRoute = typeof uploadNewFile;
export type GetFilePartUploadUrl = typeof getFilePartUploadUrl;
export type CompleteFileUpload = typeof completeFileUpload;
