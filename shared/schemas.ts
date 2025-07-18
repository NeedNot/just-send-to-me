import { z } from '@hono/zod-openapi';

export const fileSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderId: z.string(),
  thumbnail: z.string().optional(),
  size: z.number(),
});

export const createFolderSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    expiration: z.enum(['week', 'fortnight'], 'Required'),
    retention: z.enum(['week', 'fortnight'], 'Required'),
  })
  // todo better openapi schema
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

export type Folder = z.infer<typeof folderSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export type File = z.infer<typeof fileSchema>;
