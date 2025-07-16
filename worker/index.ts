import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { folders } from './db/schema';
import { drizzle } from 'drizzle-orm/d1';

const MS_IN_WEEK = 60 * 60 * 24 * 7 * 1000;

export type Env = {
  DB: D1Database;
};

const app = new OpenAPIHono<{ Bindings: Env }>();

const createFolderSchema = z.object({
  name: z.string().min(1, 'Required'),
  expiration: z.enum(['week', 'fortnight'], 'Required'),
  retention: z.enum(['week', 'fortnight'], 'Required'),
});

const folderSchema = z
  .object({
    id: z.string(),
    name: z.string().max(128),
    expiresAt: z.date(),
    deletesAt: z.date(),
    maxSize: z.number(),
    creatorId: z.string(),
    createdAt: z.date(),
  })
  .openapi('Folder');

const createFolderRoute = createRoute({
  method: 'post',
  path: '/folder',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFolderSchema,
        },
      },
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
  },
});

app.openapi(createFolderRoute, async (c) => {
  const { name, expiration, retention } = c.req.valid('json');

  const expiresAt = new Date(
    Date.now() + MS_IN_WEEK * (expiration === 'week' ? 1 : 2),
  );
  const deletesAt = new Date(
    Date.now() + MS_IN_WEEK * (retention === 'week' ? 1 : 2),
  );

  const db = drizzle(c.env.DB);
  const result = await db
    .insert(folders)
    .values({
      name,
      maxSize: 1024 ** 3,
      creatorId: '123',
      expiresAt,
      deletesAt,
    })
    .returning();
  return c.json(result[0], 200);
});

app.get('/folder', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(folders).all();
  return c.json(result, 200);
});

export default app;
