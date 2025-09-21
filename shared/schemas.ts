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

export const createFileSchema = z
  .object({
    folderId: z.string().min(1),
    name: z.string().min(1),
    size: z.number('Required'),
  })
  .openapi({
    type: 'object',
    required: ['folderId', 'name', 'size'],
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
    expiresAt: z.date().or(z.string()),
    maxSize: z.number(),
    size: z.number(),
    createdAt: z.date(),
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

export type Folder = z.infer<typeof folderSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type ExpirationDuration = z.infer<typeof folderExpirationDuration>;

export type File = z.infer<typeof fileSchema>;
export type RequestFileUploadRequest = z.infer<typeof createFileSchema>;
export type ReuqestFileUploadResponse = z.infer<
  typeof createFileResponseSchema
>;
export type CompleteFileUploadRequest = z.infer<
  typeof completeFileUploadSchema
>;
