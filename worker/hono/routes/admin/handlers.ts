import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { GiftCreditsRoute } from './routes';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/auth-schema';

/**
 * Constant-time check of the x-admin-token header. Fails closed when
 * ADMIN_TOKEN is not configured: previously a missing secret plus a missing
 * header compared undefined === undefined and let the request through.
 */
export async function isAdminToken(
  provided: string | undefined,
  expected: string | undefined,
) {
  if (!expected || expected.length < 32 || !provided) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(provided)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export const giftCredits: AppRouteHandler<GiftCreditsRoute> = async (c) => {
  if (!(await isAdminToken(c.req.header('x-admin-token'), c.env.ADMIN_TOKEN)))
    return c.newResponse(null, 401);
  const { userId, credits } = c.req.valid('json');

  const userExists = await drizzle(c.env.DB)
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .get();

  if (!userExists) return c.newResponse(null, 404);

  const stub = c.env.USER_CREDITS_OBJECT.getByName(userId);
  await stub.giftCredits(credits);
  return c.newResponse(null, 200);
};
