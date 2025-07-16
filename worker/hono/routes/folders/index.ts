import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import * as handlers from './handlers';
import type { AppBindings } from '../../../lib/types';

export default new OpenAPIHono<AppBindings>().openapi(
  routes.createFolder,
  handlers.createFolder,
);
