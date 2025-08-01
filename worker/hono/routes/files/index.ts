import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';

export default new OpenAPIHono<AppBindings>()
  .openapi(routes.requestFileUpload, handlers.requestFileUpload)