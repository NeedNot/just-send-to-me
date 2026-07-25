import {
  defineWorkersConfig,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers/config';
import path from 'path';

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'drizzle'));

  return {
    test: {
      setupFiles: ['./tests/apply-migrations.ts'],
      globals: true,
      poolOptions: {
        workers: {
          singleWorker: true,
          experimental_remoteBindings: true,
          wrangler: { configPath: './wrangler.jsonc' },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
