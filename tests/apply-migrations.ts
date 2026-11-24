import { applyD1Migrations, env } from 'cloudflare:test';
import { vi } from 'vitest';

// nodemailer pulls in node:child_process, which the Workers test runtime
// doesn't provide. Tests never send real email.
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async () => ({ rejected: [], response: 'mocked' }),
    }),
  },
}));

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
