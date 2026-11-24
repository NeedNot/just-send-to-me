import {
  cloudflareTest,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(
        path.join(__dirname, 'drizzle'),
      );

      return {
        // tests must never touch the remote dev D1/R2 resources
        remoteBindings: false,
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            // fixed test values so tests never depend on a local .dev.vars
            STRIPE_SECRET_KEY: 'sk_test_unit_tests_only',
            STRIPE_WEBHOOK_SECRET: 'whsec_unit_tests_only',
            // lets tests mint real signed session cookies (tests/helpers.ts)
            BETTER_AUTH_SECRET: 'unit-tests-only-better-auth-secret-0123456789',
          },
        },
      };
    }),
  ],
  test: {
    setupFiles: ['./tests/apply-migrations.ts'],
  },
});
