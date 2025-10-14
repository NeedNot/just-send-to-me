import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './routes';
import * as handlers from './handlers';
import type { AppBindings, AppVariables } from '../../../lib/types';
import { generalRateLimiter } from '../../middleware/rate-limiters';

const app = new OpenAPIHono<AppBindings & AppVariables>();
app.use('/folder/*', generalRateLimiter);
app
  .openapi(routes.createFolder, handlers.createFolder)
  .openapi(routes.getFolder, handlers.getFolder);
export default app;
