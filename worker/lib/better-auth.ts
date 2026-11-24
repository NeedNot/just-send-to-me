import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../db/auth-schema';
import {
  isEmailDomainDisposable,
  sendResetPasswordEmail,
  sendVerificationEmail,
} from './email';
import { captcha, emailOTP } from 'better-auth/plugins';
import { getPlanById } from '../repositories/billing-repository';

// Auth endpoints that send an email. Limited per address (in addition to the
// per-IP limit) so nobody can mail-bomb an address or burn the email sending quota.
const EMAIL_SENDING_PATHS = new Set([
  '/email-otp/send-verification-otp',
  '/request-password-reset',
]);

export const auth = (env: Env) => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    // Pin the public origin instead of deriving it from each request's Host,
    // so origin/CSRF checks and callback/redirect validation use a fixed
    // value. In dev also trust the request's own origin (e.g. `vite --host`
    // on a LAN IP).
    baseURL: env.URL,
    trustedOrigins: (request) =>
      env.IS_DEV && request ? [new URL(request.url).origin] : [],
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: false,
        trustedProviders: ['google'],
      },
    },
    user: {
      additionalFields: {
        planId: {
          fieldName: 'plan_id',
          type: 'string',
          required: true,
          input: false,
          defaultValue: 'FREE',
        },
        deletingAt: {
          fieldName: 'deleting_at',
          type: 'date',
          required: false,
          input: false,
          defaultValue: null,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, token }) {
        const url = `${env.URL}/change-password?token=${token}`;
        try {
          await sendResetPasswordEmail(user.email, url);
        } catch (e) {
          console.log('Failed to send password reset email', e);
          throw e;
        }
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

        if (EMAIL_SENDING_PATHS.has(ctx.path)) {
          const email = String(ctx.body?.email ?? '').toLowerCase();
          const { success } = await env.EMAIL_RATE_LIMITER.limit({
            key: `${ctx.path}:${email}`,
          });
          if (!success) {
            throw new APIError('TOO_MANY_REQUESTS', { code: '429' });
          }
        }

        if (ctx.path !== '/sign-up/email') {
          return;
        }
        const name = String(ctx.body?.name ?? '').trim();
        if (name.length < 2 || name.length > 100) {
          throw new APIError('BAD_REQUEST', {
            message: 'Name must be 2-100 characters',
          });
        }
        const email = String(ctx.body?.email ?? '').toLowerCase();
        const domain = email.split('@')[1] ?? '';
        if (await isEmailDomainDisposable(domain)) {
          throw new APIError('FORBIDDEN', {
            message: 'Cannot create account at this time',
          });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (ctx) => {
            const freePlan = await getPlanById(db, 'FREE');
            const stub = env.USER_CREDITS_OBJECT.getByName(ctx.id);
            await stub.updateMaxCredits(freePlan?.credits ?? 3);
          },
        },
      },
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  });
};
