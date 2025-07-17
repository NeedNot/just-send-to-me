import { OpenAPIHono } from '@hono/zod-openapi';
import folderRoutes from './hono/routes/folders';
import type { AppBindings } from './lib/types';

const app = new OpenAPIHono<AppBindings>();

app.route('/api', folderRoutes);

export default app;
