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
import { resolveViewer } from '../../../lib/folder-access';
import { getUploaderId } from '../../../lib/uploader-identity';
import {
  listFilesForViewer,
  toPublicFile,
} from '../../../repositories/file-repository';

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
  const folder = await getFolderById(db, id);
  if (!folder) return c.notFound();
  if (folder.expiresAt < new Date())
    return c.json({ message: 'Folder expired' }, 410);

  const viewer = resolveViewer(folder, c.get('user'), await getUploaderId(c));
  const files = (await listFilesForViewer(db, folder.id, viewer)).map(
    toPublicFile,
  );

  const shared = {
    id: folder.id,
    name: folder.name,
    expiresAt: folder.expiresAt,
    createdAt: folder.createdAt,
    maxSize: folder.maxSize,
    maxFiles: folder.maxFiles,
    size: folder.size,
    viewer: viewer.role,
    files,
  };

  if (viewer.role === 'owner') {
    return c.json(
      {
        ...shared,
        creatorId: folder.creatorId,
        fileCount: folder.fileCount,
        creditCost: folder.creditCost,
      },
      200,
    );
  }
  // uploaders and visitors: nothing that reveals how many files others sent
  return c.json(shared, 200);
};
