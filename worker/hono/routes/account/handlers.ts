import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type {
  RestoreAccountRoute,
  DeleteMyAccountRoute,
  GetMyAccountRoute,
  GetMyFoldersRoute,
} from './routes';
import { getFoldersByCreator } from '../../../repositories/folder-repository';
import type { Folder } from '../../../../shared/schemas';
import {
  getPlanById,
  getUserSubscription,
} from '../../../repositories/billing-repository';
import Stripe from 'stripe';
import { account, user as userTable } from '../../../db/auth-schema';
import { and, eq } from 'drizzle-orm';
import { MS_IN_DAY } from '../../../../shared/constants';

export const getMyFolders: AppRouteHandler<GetMyFoldersRoute> = async (c) => {
  const user = c.get('user')!;

  const db = drizzle(c.env.DB);
  const allFolders = await getFoldersByCreator(db, user.id);
  const folders: Folder[] = [];
  const expiredFolders: Folder[] = [];

  for (const folder of allFolders) {
    if (folder.expiresAt > new Date()) {
      folders.push(folder);
    } else {
      expiredFolders.push(folder);
    }
  }

  return c.json({ folders, expiredFolders }, 200);
};

export const getMyAccount: AppRouteHandler<GetMyAccountRoute> = async (c) => {
  const user: any = c.get('user');
  if (!user) return c.body(null, 401);

  const db = drizzle(c.env.DB);
  const plan = await getPlanById(db, user.planId);

  const userCreditsObject = c.env.USER_CREDITS_OBJECT.getByName(user.id);
  const remainingCredits = await userCreditsObject.getRemainingCredits();

  return c.json(
    {
      name: user.name,
      email: user.email,
      remainingCredits,
      deletingAt: user.deletingAt,
      plan: {
        id: plan?.id ?? '',
        name: plan?.name ?? 'Free',
        credits: plan?.credits ?? 3,
      },
    },
    200,
  );
};

export const deleteMyAccount: AppRouteHandler<DeleteMyAccountRoute> = async (
  c,
) => {
  const user: any = c.get('user')!;
  const db = drizzle(c.env.DB);

  if (user.deletingAt) {
    return c.json(
      { error: 'Your account is already scheduled to be deleted' },
      400,
    );
  }

  // verify password
  const { password } = c.req.valid('json');
  const auth = c.get('auth')!;
  const hash = await db
    .select({ hash: account.password })
    .from(account)
    .where(
      and(eq(account.userId, user.id), eq(account.providerId, 'credential')),
    )
    .get()
    .then((account) => account?.hash);
  if (!hash)
    return c.json({ error: 'No password is set for this account' }, 400);
  const isPasswordValid = await (
    await auth.$context
  ).password.verify({
    password,
    hash,
  });

  if (!isPasswordValid) {
    return c.json({ error: 'Password is incorrect' }, 401);
  }

  // verify user has no subscriptions
  const sub = await getUserSubscription(db, user.id);
  if (sub?.status === 'active') {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const stripeSub = await stripe.subscriptions.retrieve(sub.id);
    const canceled = stripeSub.cancel_at || stripeSub.canceled_at;
    if (!canceled) {
      return c.json({ error: 'You must cancel your subscription first' }, 403);
    }
  }

  const updatedAt = new Date();
  const deletingAt = new Date(Date.now() + 30 * MS_IN_DAY);
  console.log('updatedAt', updatedAt);

  await db
    .update(userTable)
    .set({
      deleting_at: deletingAt,
      updatedAt,
    })
    .where(eq(userTable.id, user.id));

  await c.env.DELETE_ACCOUNT_WORKFLOW.create({
    id: `${user.id}-${updatedAt.getTime()}`,
    params: { userId: user.id, updatedAt: updatedAt },
  });

  return c.json({ deletingAt }, 200);
};

export const restoreAccount: AppRouteHandler<RestoreAccountRoute> = async (
  c,
) => {
  const user: any = c.get('user');
  if (!user) return c.body(null, 401);

  if (!user.deletingAt)
    return c.json(
      { message: 'Your account is not scheduled to be deleted' },
      200,
    );

  const db = drizzle(c.env.DB);
  await Promise.allSettled([
    db
      .update(userTable)
      .set({ deleting_at: null, updatedAt: new Date() })
      .where(eq(userTable.id, user.id)),
    c.env.DELETE_ACCOUNT_WORKFLOW.get(`${user.id}-${user.updatedAt}`).then(
      (wf) => wf.terminate(),
    ),
  ]);

  return c.json({ deletingAt: null }, 200);
};
