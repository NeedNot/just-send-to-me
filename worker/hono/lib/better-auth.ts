import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../../db/auth-schema';
import { createUserMetadata } from '../../repositories/user-metadata-repository';

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth/',
    emailAndPassword: {
      enabled: true,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-up/email') {
          return;
        }
        if (ctx.body?.name.length < 2) {
          throw new APIError('BAD_REQUEST', {
            message: 'Name too short',
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (!ctx.path.startsWith('/sign-up')) {
          return;
        }
        const newSession = ctx.context.newSession;
        if (newSession) {
          await createUserMetadata(db, newSession.user.id);
        }
      }),
    },
  });
};
