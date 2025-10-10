import { OpenAPIHono } from '@hono/zod-openapi';
import folderRoutes from './hono/routes/folders';
import fileRoutes from './hono/routes/files';
import accountRoutes from './hono/routes/account';
import type { AppBindings, AppVariables, EventNotification } from './lib/types';
import { drizzle } from 'drizzle-orm/d1/driver';
import { addFileMetaToFolder } from './repositories/folder-repository';
import { auth } from './lib/better-auth';
import { files, folders } from './db/schema';
import { and, eq, inArray, lt } from 'drizzle-orm';

const app = new OpenAPIHono<AppBindings & AppVariables>();

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth(c.env).handler(c.req.raw);
});
app.use('/api/*', async (c, next) => {
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);
  return next();
});
app.route('/api', folderRoutes);
app.route('/api', fileRoutes);
app.route('/api', accountRoutes);

export { app };

export default {
  scheduled: async (controller, env, ctx) => {
    const db = drizzle(env.DB);
    const expiredFolderIds = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(lt(folders.expiresAt, new Date()), eq(folders.filesDeleted, false)),
      )
      .then((r) => r.map((f) => f.id));
    if (expiredFolderIds.length === 0) return;

    const expiredFiles = await db
      .select({ id: files.id, key: files.key })
      .from(files)
      .where(inArray(files.folderId, expiredFolderIds))
      .limit(1000);
    if (expiredFiles.length == 0) return;

    const chunkSize = 90;
    for (let i = 0; i < expiredFiles.length; i += chunkSize) {
      const batch = expiredFiles.slice(i, i + chunkSize);
      // delete objects
      await env.files_bucket.delete(batch.map((f) => f.key));
      // delete files
      await db.delete(files).where(
        inArray(
          files.id,
          batch.map((f) => f.id),
        ),
      );
    }
    // mark folder as deleted
    await db
      .update(folders)
      .set({ filesDeleted: true })
      .where(inArray(folders.id, expiredFolderIds));
  },
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
