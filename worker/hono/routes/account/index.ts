import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings, AppVariables } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';
import { requireUser } from '../../middleware/require-user';
import { generalRateLimiter } from '../../middleware/rate-limiters';

const app = new OpenAPIHono<AppBindings & AppVariables>();
app.use('/account/*', requireUser);
app.use('/account/*', generalRateLimiter);
app.openapi(routes.getMyFolders, handlers.getMyFolders);
app.openapi(routes.getMyAccount, handlers.getMyAccount);
export default app;
