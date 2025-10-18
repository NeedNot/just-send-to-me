import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/auth-schema';
import { isEmailDomainDisposable, sendVerificationEmail } from './email';
import { captcha, emailOTP } from 'better-auth/plugins';

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    user: {
      additionalFields: {
        planId: {
          fieldName: 'plan_id',
          type: 'string',
          required: true,
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, token }) {
        const { success } = await env.GENERAL_RATE_LIMITER.limit({
          key: user.email,
        });

        if (!success) {
          throw new APIError('TOO_MANY_REQUESTS', { code: '429' });
        }
        const url = `${env.BETTER_AUTH_URL}/change-password?token=${token}`;
        await sendVerificationEmail(user.email, url);
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
    },
    plugins: [
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: env.TURNSTILE_SECRET_KEY,
        endpoints: ['/email-otp/verify-email'],
      }),
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
        if (!ctx.path.startsWith('/get-session')) {
          const ip = ctx.headers?.get('cf-connecting-ip') || '';
          const { success } = await env.GENERAL_RATE_LIMITER.limit({ key: ip });

          if (!success) {
            throw new APIError('TOO_MANY_REQUESTS', { code: '429' });
          }
        }

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
