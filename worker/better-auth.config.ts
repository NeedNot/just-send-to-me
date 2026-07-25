import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import { drizzle } from 'drizzle-orm/d1/driver';
import * as schema from './lib/better-auth';

const { DB, BETTER_AUTH_URL } = process.env as any;
const db = drizzle(DB);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }), // schema is required in order for better-auth to recognize
  baseURL: BETTER_AUTH_URL,
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
});
