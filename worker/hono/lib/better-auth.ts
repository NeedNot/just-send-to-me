import { betterAuth } from 'better-auth';
import { drizzle } from 'drizzle-orm/d1/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '../../db/better-auth-schema';

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/',
    emailAndPassword: {
      enabled: true,
    },
  });
};
