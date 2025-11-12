import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings, AppVariables } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';

export default new OpenAPIHono<AppBindings & AppVariables>()
  .openapi(routes.createCheckoutSession, handlers.createCheckoutSession)
  .openapi(routes.stripeWebhook, handlers.stripeWebHook)
  .openapi(routes.stripeBillingPortal, handlers.stripeBillingPortal)
  .openapi(routes.getSubscription, handlers.getSubscription);
