import { describe, expect, it } from 'vitest';
import { isAdminToken } from '../worker/hono/routes/admin/handlers';

const TOKEN = 'a'.repeat(64);

describe('isAdminToken', () => {
  it('accepts the configured token', async () => {
    expect(await isAdminToken(TOKEN, TOKEN)).toBe(true);
  });

  it('rejects a wrong or missing token', async () => {
    expect(await isAdminToken('b'.repeat(64), TOKEN)).toBe(false);
    expect(await isAdminToken(undefined, TOKEN)).toBe(false);
  });

  it('fails closed when ADMIN_TOKEN is unset or weak', async () => {
    // previously undefined === undefined let unauthenticated requests through
    expect(await isAdminToken(undefined, undefined)).toBe(false);
    expect(await isAdminToken('', '')).toBe(false);
    expect(await isAdminToken('short', 'short')).toBe(false);
  });
});
