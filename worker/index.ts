import { OpenAPIHono } from '@hono/zod-openapi';
import folderRoutes from './hono/routes/folders';
import fileRoutes from './hono/routes/files';
import type { AppBindings, AppVariables, EventNotification } from './lib/types';
import { markFileUploaded } from './repositories/file-repository';
import { drizzle } from 'drizzle-orm/d1/driver';
import { addFileSizeToFolder } from './repositories/folder-repository';
import { auth } from './hono/lib/better-auth';

const app = new OpenAPIHono<AppBindings & AppVariables>();

app.on(['GET', 'POST'], '/api/*', (c) => {
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

export { app };

export default {
  fetch: app.fetch,
  queue: async (batch, env) => {
    const db = drizzle(env.DB);
    for (const msg of batch.messages) {
      try {
        const body = msg.body as EventNotification;
        const file = await markFileUploaded(db, body.object);
        await addFileSizeToFolder(db, file);
      } catch (e) {
        console.error(e);
        msg.retry();
      }
    }
    batch.ackAll();
  },
} satisfies ExportedHandler<Env>;
