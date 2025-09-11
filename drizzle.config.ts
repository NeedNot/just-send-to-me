import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./worker/db/schema.ts', './worker/db/better-auth-schema.ts'],
  out: './drizzle',
});
