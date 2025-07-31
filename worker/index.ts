import { OpenAPIHono } from '@hono/zod-openapi';
import folderRoutes from './hono/routes/folders';
import fileRoutes from './hono/routes/files';
import type { AppBindings, EventNotification } from './lib/types';
import { markFileUploaded } from './repositories/file-repository';
import { drizzle } from 'drizzle-orm/d1/driver';
import { addFileSizeToFolder } from './repositories/folder-repository';

const app = new OpenAPIHono<AppBindings>();

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
