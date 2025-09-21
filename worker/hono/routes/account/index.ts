import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppBindings, AppVariables } from '../../../lib/types';
import * as routes from './routes';
import * as handlers from './handlers';
import { requireUser } from '../../middleware/require-user';

const app = new OpenAPIHono<AppBindings & AppVariables>();
app.use('/account/*', requireUser);
app.openapi(routes.getMyFolders, handlers.getMyFolders);
export default app;
