import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import type { CreateFolderRoute, GetFolderRoute } from './routes';
import {
  getFolderById,
  createFolder as repositoryCreateFolder,
} from '../../../repositories/folder-repository';
import {
  CREDIT_COSTS,
  EXPIRATION_DURATIONS,
} from '../../../../shared/constants';
import type { User } from 'better-auth';

export const createFolder: AppRouteHandler<CreateFolderRoute> = async (c) => {
  const user = c.get('user') as User & { planId: string };

  const { name, expiration } = c.req.valid('json');
  const duration = EXPIRATION_DURATIONS[expiration];
  const expiresAt = new Date(Date.now() + duration);
  const creditCost = CREDIT_COSTS[expiration];

  const db = drizzle(c.env.DB);

  const userCreditsObject = c.env.USER_CREDITS_OBJECT.getByName(user.id);

  // Spend first: the DO serialises spends, so two concurrent requests can't
  // both pass a balance check and overdraw. Refund if the insert fails.
  let transactionId: number;
  try {
    transactionId = await userCreditsObject.spendCredits(creditCost);
  } catch {
    return c.json(
      {
        code: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient credits to create folder',
      },
      403,
    );
  }

  try {
    const result = await repositoryCreateFolder(db, {
      name,
      creator: user,
      expiresAt,
      creditCost,
    });
    return c.json(result, 200);
  } catch (e) {
    await userCreditsObject.refundTransaction(transactionId);
    throw e;
  }
};

export const getFolder: AppRouteHandler<GetFolderRoute> = async (c) => {
  const { id } = c.req.valid('param');

  const db = drizzle(c.env.DB);
  const result = await getFolderById(db, id, { withFiles: true });
  if (!result) return c.notFound();
  if (result.expiresAt < new Date())
    return c.json({ message: 'Folder expired' }, 410);
  return c.json(result, 200);
};
