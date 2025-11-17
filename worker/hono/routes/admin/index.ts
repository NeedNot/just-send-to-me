import { OpenAPIHono } from '@hono/zod-openapi';
import * as handlers from './handlers';
import * as routes from './routes';
import type { AppBindings, AppVariables } from '../../../lib/types';

export default new OpenAPIHono<AppBindings & AppVariables>().openapi(
  routes.giftCredits,
  handlers.giftCredits,
);
