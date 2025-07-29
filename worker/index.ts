import { OpenAPIHono } from '@hono/zod-openapi';
import folderRoutes from './hono/routes/folders';
import fileRoutes from './hono/routes/files';
import type { AppBindings } from './lib/types';

const app = new OpenAPIHono<AppBindings>();

app.route('/api', folderRoutes);
app.route('/api', fileRoutes);

export default app;
