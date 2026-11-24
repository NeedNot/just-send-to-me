import { z } from '@hono/zod-openapi';

export const folderExpirationDuration = z.enum(['1d', '3d', '7d']);

// What the API returns for a file. Deliberately no R2 key or uploader id:
// downloads go through /api/files/{id}/download, which checks access.
export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string(),
  thumbnail: z.string().optional(),
  size: z.number(),
  createdAt: z.date().or(z.string()).optional(),
});

// R2 multipart: at most 10,000 parts; the client uses 10 MiB parts
export const MAX_UPLOAD_PARTS = 10_000;
export const UPLOAD_PART_SIZE = 1024 * 1024 * 10;

export const uploadNewFileSchema = z
  .object({
    folderId: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    // must be a positive whole byte count: negative sizes used to inflate
    // the folder's remaining space in the uploads Durable Object
    size: z
      .number()
      .int()
      .positive()
      .max(MAX_UPLOAD_PARTS * UPLOAD_PART_SIZE),
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
    name: z.string().trim().min(1).max(128),
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

// Who is looking at a folder page:
// - owner: the signed-in creator; sees every file
// - uploader: has an uploader cookie; sees only the files they sent
// - visitor: neither; sees no files
export const folderViewerRole = z.enum(['owner', 'uploader', 'visitor']);

// GET /folders/{id}. Non-owners get no file count, creator id or cost, so
// they can't learn what (or how much) other people sent. `size` stays so
// the uploader can see whether their file fits.
export const folderViewSchema = folderSchema
  .omit({ files: true, creatorId: true, fileCount: true, creditCost: true })
  .extend({
    viewer: folderViewerRole,
    files: z.array(fileSchema),
    creatorId: z.string().optional(),
    fileCount: z.number().optional(),
    creditCost: z.number().optional(),
  })
  .openapi({ type: 'object' });

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
  partNumber: z.number().int().min(1).max(MAX_UPLOAD_PARTS),
  etag: z.string().min(1).max(256),
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
  deletingAt: z.date(),
});

export const createCheckoutSessionSchema = z.object({
  planId: z.string().nonempty(),
  duration: z.enum(['month', 'year']),
});

export const createCheckoutSessionResponseSchema = z.object({
  url: z.string(),
});

export const confirmCheckoutSessionSchema = z.object({
  // the {CHECKOUT_SESSION_ID} Stripe puts in success_url
  sessionId: z
    .string()
    .max(255)
    .regex(/^cs_[A-Za-z0-9_]+$/),
});

export const confirmCheckoutSessionResponseSchema = z.object({
  planId: z.string(),
  active: z.boolean(),
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
  existingCustomer: z.boolean(),
});

export type UploadNewFileSchema = z.infer<typeof uploadNewFileSchema>;
export type UploadNewFileResponseSchema = z.infer<
  typeof uploadNewFileResponseSchema
>;

export type Folder = z.infer<typeof folderSchema>;
export type FolderView = z.infer<typeof folderViewSchema>;
export type FolderViewerRole = z.infer<typeof folderViewerRole>;
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

export type ConfirmCheckoutSessionResponse = z.infer<
  typeof confirmCheckoutSessionResponseSchema
>;

export type CreatePortalSessionResponse = z.infer<
  typeof createPortalSessionResponseSchema
>;

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;
