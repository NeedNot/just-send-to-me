import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/auth-schema';
import { createUserMetadata } from '../repositories/user-metadata-repository';
import { isEmailDomainDisposable, sendVerificationEmail } from './email';
import { emailOTP } from 'better-auth/plugins';

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (type === 'email-verification') {
            await sendVerificationEmail(email, otp);
          }
        },
        overrideDefaultEmailVerification: true,
      }),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // const ip = ctx.headers?.get('cf-connecting-ip') || '';
        // const { success } = await env.GENERAL_RATE_LIMITER.limit({ key: ip });

        // if (!success) {
        //   throw new APIError('TOO_MANY_REQUESTS', { code: '429' });
        // }

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
