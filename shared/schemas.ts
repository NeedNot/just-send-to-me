import { z } from '@hono/zod-openapi';

export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
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
    expiration: z.enum(['week', 'fortnight'], 'Required'),
    retention: z.enum(['week', 'fortnight'], 'Required'),
  })
  .openapi({
    type: 'object',
    required: ['name', 'expiration', 'retention'],
  });

export const folderSchema = z
  .object({
    id: z.string(),
    creatorId: z.string(),
    name: z.string().max(128),
    files: z.array(fileSchema).optional(),
    expiresAt: z.date(),
    deletesAt: z.date(),
    maxSize: z.number(),
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

export type File = z.infer<typeof fileSchema>;
export type RequestFileUploadRequest = z.infer<typeof createFileSchema>;
export type ReuqestFileUploadResponse = z.infer<
  typeof createFileResponseSchema
>;
export type CompleteFileUploadRequest = z.infer<
  typeof completeFileUploadSchema
>;
