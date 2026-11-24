import { env, runInDurableObject } from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1/driver';
import { user } from '../worker/db/auth-schema';
import { files, folders, plans } from '../worker/db/schema';
import { MS_IN_DAY } from '../shared/constants';
import { makeSignature } from 'better-auth/crypto';
import { auth } from '../worker/lib/better-auth';
import {
  generateUploaderToken,
  uploaderCookieName,
  uploaderIdFromToken,
} from '../worker/lib/uploader-identity';

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

/** Stores a file in R2 and D1, tagged with `uploaderId` (null = legacy). */
export async function seedFile(
  folder: { id: string; creatorId: string },
  {
    name = 'file.txt',
    body = 'hello',
    uploaderId = null,
  }: { name?: string; body?: string; uploaderId?: string | null } = {},
) {
  const id = crypto.randomUUID();
  const key = `${folder.creatorId}/${folder.id}/${id}`;
  await env.FILES_BUCKET.put(key, body, {
    httpMetadata: { contentType: 'text/plain' },
  });
  return db()
    .insert(files)
    .values({
      id,
      folderId: folder.id,
      name,
      key,
      size: body.length,
      uploaderId,
    })
    .returning()
    .get();
}

/** A fresh anonymous uploader: its cookie header and the id files get. */
export async function newUploader({ secure = false } = {}) {
  const token = generateUploaderToken();
  return {
    cookie: `${uploaderCookieName(secure)}=${token}`,
    uploaderId: await uploaderIdFromToken(token),
  };
}

/** A real, signed better-auth session cookie for `userId`. */
export async function sessionCookie(userId: string) {
  const ctx = await auth(env).$context;
  const session = await ctx.internalAdapter.createSession(userId);
  const signature = await makeSignature(session.token, ctx.secret);
  return `${ctx.authCookies.sessionToken.name}=${session.token}.${signature}`;
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
