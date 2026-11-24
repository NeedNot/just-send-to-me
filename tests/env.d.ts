// Test-only bindings added in vitest.config.ts
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}
