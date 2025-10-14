import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/auth-schema';
import { createUserMetadata } from '../repositories/user-metadata-repository';
import { isEmailDomainDisposable, sendVerificationEmail } from './email';

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        await sendVerificationEmail(user.email, url);
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-up/email') {
          return;
        }
        if (ctx.body?.name.length < 2) {
          throw new APIError('BAD_REQUEST', {
            message: 'Name is too short',
          });
        }
        const email = ctx.body?.email.toLowerCase() ?? '';
        const domain = email.split('@')[1];
        if (await isEmailDomainDisposable(domain)) {
          throw new APIError('FORBIDDEN', {
            message: 'Cannot create account at this time',
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
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
};
