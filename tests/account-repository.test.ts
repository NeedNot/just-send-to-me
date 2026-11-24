import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { user } from '../worker/db/auth-schema';
import { files, folders, subscriptions } from '../worker/db/schema';
import {
  deleteAccountWorkflowId,
  deleteScheduledUser,
  deleteUserObjects,
} from '../worker/repositories/account-repository';
import { db, seedFolder, seedUser } from './helpers';

async function scheduleDeletion(userId: string) {
  const updatedAt = new Date(Date.now() - 1000);
  await db()
    .update(user)
    .set({ deleting_at: new Date(Date.now() - 1), updatedAt })
    .where(eq(user.id, userId));
  return updatedAt;
}

describe('deleteScheduledUser', () => {
  it('deletes a user who owns folders, files and a subscription', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId);
    await db()
      .insert(files)
      .values({
        folderId: folder.id,
        name: 'a.txt',
        key: `${userId}/${folder.id}/x`,
        size: 1,
      });
    await db()
      .insert(subscriptions)
      .values({
        id: `sub_${userId}`,
        customerId: `cus_${userId}`,
        userId,
        planId: 'PLUS',
        createdAt: new Date(),
        status: 'inactive',
      });
    const updatedAt = await scheduleDeletion(userId);

    // the old implementation deleted only the user row, which D1 rejects
    const fkError = await db()
      .delete(user)
      .where(eq(user.id, userId))
      .run()
      .then(
        () => null,
        (e: Error) => String(e.cause ?? e),
      );
    expect(fkError).toMatch(/FOREIGN KEY/);

    const deleted = await deleteScheduledUser(db(), { userId, updatedAt });
    expect(deleted?.id).toBe(userId);
    expect(
      await db().select().from(folders).where(eq(folders.creatorId, userId)),
    ).toHaveLength(0);
    expect(
      await db()
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId)),
    ).toHaveLength(0);
  });

  it('leaves a user alone if they were updated after the request', async () => {
    const userId = await seedUser();
    await scheduleDeletion(userId);
    const deleted = await deleteScheduledUser(db(), {
      userId,
      updatedAt: new Date(0),
    });
    expect(deleted).toBeUndefined();
    expect(
      await db().select().from(user).where(eq(user.id, userId)),
    ).toHaveLength(1);
  });
});

describe('deleteUserObjects', () => {
  it('removes only objects under the user prefix', async () => {
    await env.FILES_BUCKET.put('u1/f/a', 'a');
    await env.FILES_BUCKET.put('u1/f/b', 'b');
    await env.FILES_BUCKET.put('u2/f/c', 'c');
    expect(await deleteUserObjects(env.FILES_BUCKET, 'u1')).toBe(2);
    expect(
      (await env.FILES_BUCKET.list({ prefix: 'u1/' })).objects,
    ).toHaveLength(0);
    expect(await env.FILES_BUCKET.head('u2/f/c')).not.toBeNull();
  });
});

describe('deleteAccountWorkflowId', () => {
  it('matches for Date, ISO string and epoch inputs', () => {
    const d = new Date('2026-01-02T03:04:05.678Z');
    const id = deleteAccountWorkflowId('u', d);
    expect(deleteAccountWorkflowId('u', d.toISOString())).toBe(id);
    expect(deleteAccountWorkflowId('u', d.getTime())).toBe(id);
    expect(id).toBe('u-1767323045678');
  });
});
