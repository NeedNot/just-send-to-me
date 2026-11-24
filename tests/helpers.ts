import { env, runInDurableObject } from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1/driver';
import { user } from '../worker/db/auth-schema';
import { folders, plans } from '../worker/db/schema';
import { MS_IN_DAY } from '../shared/constants';

export const db = () => drizzle(env.DB);

export async function seedPlans() {
  await db()
    .insert(plans)
    .values([
      {
        id: 'FREE',
        name: 'Free',
        maxStoragePerFolder: 1024 ** 3,
        maxFileCountPerFolder: 100,
        credits: 3,
      },
      {
        id: 'PLUS',
        name: 'Plus',
        priceIdMonthly: 'price_plus_month',
        priceIdYearly: 'price_plus_year',
        maxStoragePerFolder: 5 * 1024 ** 3,
        maxFileCountPerFolder: 100,
        credits: 10,
      },
    ])
    .onConflictDoNothing();
}

export async function seedUser(id = crypto.randomUUID()) {
  await seedPlans();
  await db()
    .insert(user)
    .values({ id, name: 'Test User', email: `${id}@example.com` });
  return id;
}

export async function seedFolder(
  creatorId: string,
  overrides: Partial<typeof folders.$inferInsert> = {},
) {
  return db()
    .insert(folders)
    .values({
      name: 'Test folder',
      maxSize: 1000,
      maxFiles: 3,
      creatorId,
      expiresAt: new Date(Date.now() + MS_IN_DAY),
      ...overrides,
    })
    .returning()
    .get();
}

/**
 * runInDurableObject with the instance typed as the concrete class (the
 * generated worker types and the pool's types don't unify on their own).
 */
export function inDurableObject<T, R>(
  stub: unknown,
  fn: (instance: T, state: DurableObjectState) => R | Promise<R>,
): Promise<R> {
  const run = runInDurableObject as unknown as (
    stub: unknown,
    fn: unknown,
  ) => Promise<R>;
  return run(stub, fn);
}
