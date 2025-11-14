import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings, AppVariables } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';
import { requireUser } from '../../middleware/require-user';
import { generalRateLimiter } from '../../middleware/rate-limiters';

const app = new OpenAPIHono<AppBindings & AppVariables>();
app.openapi(routes.getMyAccount, handlers.getMyAccount);
app.openapi(routes.restoreAccount, handlers.restoreAccount);
app.use('/account/*', requireUser);
app.use('/account/*', generalRateLimiter);
app.openapi(routes.getMyFolders, handlers.getMyFolders);
app.openapi(routes.deleteMyAccount, handlers.deleteMyAccount);
export default app;
