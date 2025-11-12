import { z } from '@hono/zod-openapi';

export const folderExpirationDuration = z.enum(['1d', '3d', '7d']);

export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  folderId: z.string(),
  thumbnail: z.string().optional(),
  size: z.number(),
});

export const uploadNewFileSchema = z
  .object({
    folderId: z.string().min(1),
    name: z.string().min(1),
    size: z.number(),
  })
  .openapi({
    type: 'object',
    required: ['folderId', 'name', 'size'],
  });

export const uploadNewFileResponseSchema = z
  .object({
    uploadId: z.string(),
  })
  .openapi({
    type: 'object',
    required: ['uploadId'],
  });

export const createFileResponseSchema = z
  .object({
    id: z.string(),
    signedUrl: z.string(),
  })
  .openapi({
    type: 'object',
    required: ['id', 'signedUrl'],
  });

export const uploadFileResponseSchema = z
  .object({
    uploadId: z.string(),
    key: z.string(),
  })
  .openapi({
    type: 'object',
    required: ['uploadId', 'key'],
  });

export const completeFileUploadSchema = z
  .object({
    folderId: z.string().min(1),
    id: z.string().min(1),
  })
  .openapi({
    type: 'object',
    required: ['folderId', 'id'],
  });

export const createFolderSchema = z
  .object({
    name: z.string().min(1),
    expiration: folderExpirationDuration,
  })
  .openapi({
    type: 'object',
    required: ['name', 'expiration'],
  });

export const folderSchema = z
  .object({
    id: z.string(),
    creatorId: z.string(),
    name: z.string().max(128),
    files: z.array(fileSchema).optional(),
    fileCount: z.number(),
    maxFiles: z.number(),
    expiresAt: z.date().or(z.string()),
    maxSize: z.number(),
    size: z.number(),
    createdAt: z.date(),
    creditCost: z.number(),
  })
  .openapi({
    type: 'object',
  });

export const planSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    credits: z.number(),
  })
  .openapi({
    type: 'object',
  });

export const IdParamSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
      required: true,
    },
    required: ['id'],
  }),
});

export const R2UploadedPartSchema = z.object({
  partNumber: z.number(),
  etag: z.string(),
});

export const myFoldersResponseSchema = z.object({
  folders: z.array(folderSchema.omit({ files: true })),
  expiredFolders: z.array(folderSchema.omit({ files: true })),
});

export const myAccountResponseSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().nonempty(),
  remainingCredits: z.number(),
  plan: planSchema,
});

export const createCheckoutSessionSchema = z.object({
  planId: z.string().nonempty(),
  duration: z.enum(['month', 'year']),
});

export const createCheckoutSessionResponseSchema = z.object({
  url: z.string(),
});

export const createPortalSessionResponseSchema = z.object({
  url: z.string(),
});

export const subscriptionResponseSchema = z.object({
  planId: z.string(),
  createdAt: z.date(),
  currentPeriodEnd: z.date(),
  status: z.enum(['active', 'inactive']),
  cancelsAtPeriodEnd: z.boolean(),
});

export type UploadNewFileSchema = z.infer<typeof uploadNewFileSchema>;
export type UploadNewFileResponseSchema = z.infer<
  typeof uploadNewFileResponseSchema
>;

export type Folder = z.infer<typeof folderSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type ExpirationDuration = z.infer<typeof folderExpirationDuration>;

export type File = z.infer<typeof fileSchema>;
export type ReuqestFileUploadResponse = z.infer<
  typeof createFileResponseSchema
>;
export type CompleteFileUploadRequest = z.infer<
  typeof completeFileUploadSchema
>;
export type MyFoldersReponse = z.infer<typeof myFoldersResponseSchema>;
export type MyAccountResponse = z.infer<typeof myAccountResponseSchema>;

export type CreateCheckoutSessionRequest = z.infer<
  typeof createCheckoutSessionSchema
>;
export type CreateCheckoutSessionResponse = z.infer<
  typeof createCheckoutSessionResponseSchema
>;

export type CreatePortalSessionResponse = z.infer<
  typeof createPortalSessionResponseSchema
>;

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;
