import { OpenAPIHono } from '@hono/zod-openapi';
import { secureHeaders } from 'hono/secure-headers';
import type { AppBindings, AppVariables } from '../lib/types';
import { auth } from '../lib/better-auth';
import folderRoutes from './routes/folders';
import fileRoutes from './routes/files';
import accountRoutes from './routes/account';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';

export const app = new OpenAPIHono<AppBindings & AppVariables>();

// nosniff, frame denial, referrer policy, HSTS etc. on every API response;
// API responses are JSON, so lock CSP down completely
app.use(
  '/api/*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
    crossOriginResourcePolicy: 'same-origin',
  }),
);

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth(c.env).handler(c.req.raw);
});
app.use('/api/*', async (c, next) => {
  const authClient = auth(c.env);
  const session = await authClient.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set('auth', authClient);

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);
  return next();
});
app.route('/api', folderRoutes);
app.route('/api', fileRoutes);
app.route('/api', accountRoutes);
app.route('/api', billingRoutes);
app.route('/api', adminRoutes);
