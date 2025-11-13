import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type {
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
  const user: any = c.get('user')!;

  const db = drizzle(c.env.DB);
  const plan = await getPlanById(db, user.planId);

  const userCreditsObject = c.env.USER_CREDITS_OBJECT.getByName(user.id);
  const remainingCredits = await userCreditsObject.getRemainingCredits();

  return c.json(
    {
      name: user.name,
      email: user.email,
      remainingCredits,
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

  if (user.deletes_at) {
    return c.json(
      { error: 'Your account is already scheduled to be deleted' },
      400,
    );
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

  return c.newResponse(null, 200);
};
