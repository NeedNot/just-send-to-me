import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { GiftCreditsRoute } from './routes';
import { eq } from 'drizzle-orm';
import { user } from '../../../db/auth-schema';

// todo could move the token check to middleware
export const giftCredits: AppRouteHandler<GiftCreditsRoute> = async (c) => {
  const token = c.req.header('x-admin-token');
  if (token !== c.env.ADMIN_TOKEN) return c.newResponse(null, 401);
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
