import { createRoute, z } from '@hono/zod-openapi';
import {
  fileSchema,
  IdParamSchema,
  R2UploadedPartSchema,
  uploadFileResponseSchema,
  uploadNewFileSchema,
} from '../../../../shared/schemas';
import {
  downloadRateLimiter,
  uploadRateLimiter,
} from '../../middleware/rate-limiters';

export const startUploaderSession = createRoute({
  middleware: uploadRateLimiter,
  method: 'post',
  path: '/files/uploader-session',
  responses: {
    204: {
      description:
        'Uploader cookie issued (or refreshed). Required before uploading.',
    },
  },
});

export const downloadFile = createRoute({
  middleware: downloadRateLimiter,
  method: 'get',
  path: '/files/{id}/download',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'The file, as an attachment',
    },
    206: {
      description: 'Part of the file (Range request)',
    },
    404: {
      description:
        'No such file, or the caller is neither the folder owner nor its uploader',
    },
    410: {
      description: 'Folder expired',
    },
    416: {
      description: 'Range not satisfiable',
    },
  },
});

export const uploadNewFile = createRoute({
  middleware: uploadRateLimiter,
  method: 'post',
  path: '/files/upload/new',
  request: {
    body: {
      content: {
        'application/json': {
          schema: uploadNewFileSchema,
        },
      },
      required: true,
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
    401: {
      description: 'No uploader session',
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
        .regex(/^[1-9][0-9]{0,4}$/, 'partNumber must be 1-10000')
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
    401: {
      description: 'No uploader session',
    },
  },
});

export const abortFileUpload = createRoute({
  method: 'delete',
  path: '/files/upload',
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
  },
  responses: {
    204: {
      description: 'Upload aborted',
    },
    401: {
      description: 'No uploader session',
    },
  },
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
          schema: z.array(R2UploadedPartSchema).min(1).max(10_000),
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
      description: 'File upload successfully completed',
    },
    401: {
      description: 'No uploader session',
    },
    400: {
      description: 'Bad request',
    },
  },
});

export type UploadNewFileRoute = typeof uploadNewFile;
export type GetFilePartUploadUrl = typeof getFilePartUploadUrl;
export type CompleteFileUpload = typeof completeFileUpload;
export type AbortFileUpload = typeof abortFileUpload;
export type StartUploaderSessionRoute = typeof startUploaderSession;
export type DownloadFileRoute = typeof downloadFile;
