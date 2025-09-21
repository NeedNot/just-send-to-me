import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import * as handlers from './handlers';
import type { AppBindings, AppVariables } from '../../../lib/types';

export default new OpenAPIHono<AppBindings & AppVariables>()
  .openapi(routes.createFolder, handlers.createFolder)
  .openapi(routes.getFolder, handlers.getFolder);
