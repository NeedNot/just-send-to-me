import type { DrizzleD1Database } from 'drizzle-orm/d1/driver';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { user } from '../db/auth-schema';
import { files, folders, subscriptions } from '../db/schema';

/** Instance id shared by the delete-account workflow's create and terminate calls. */
export function deleteAccountWorkflowId(
  userId: string,
  updatedAt: Date | string | number,
) {
  return `${userId}-${new Date(updatedAt).getTime()}`;
}

/**
 * Deletes a user scheduled for deletion together with the rows that reference
 * it. folders/files/subscriptions have no ON DELETE CASCADE and D1 enforces
 * foreign keys, so deleting only the user row fails once they own anything.
 *
 * Returns the deleted user, or undefined when the user no longer matches
 * (restored, edited since the request, or not yet due).
 */
export async function deleteScheduledUser(
  db: DrizzleD1Database & { $client: D1Database },
  { userId, updatedAt }: { userId: string; updatedAt: Date },
) {
  const target = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.id, userId),
        lt(user.deleting_at, new Date()),
        eq(user.updatedAt, updatedAt),
      ),
    )
    .get();
  if (!target) return undefined;

  const folderIds = db
    .select({ id: folders.id })
    .from(folders)
    .where(eq(folders.creatorId, userId));

  const [, , , deleted] = await db.batch([
    db.delete(files).where(inArray(files.folderId, folderIds)),
    db.delete(folders).where(eq(folders.creatorId, userId)),
    db.delete(subscriptions).where(eq(subscriptions.userId, userId)),
    db
      .delete(user)
      .where(
        and(
          eq(user.id, userId),
          lt(user.deleting_at, new Date()),
          eq(user.updatedAt, updatedAt),
        ),
      )
      .returning(),
  ]);
  return deleted[0];
}

/** Deletes every R2 object stored under the user's key prefix. */
export async function deleteUserObjects(bucket: R2Bucket, userId: string) {
  let cursor: string | undefined;
  let count = 0;
  do {
    const page = await bucket.list({ prefix: `${userId}/`, cursor });
    if (page.objects.length > 0) {
      await bucket.delete(page.objects.map((o) => o.key));
      count += page.objects.length;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return count;
}
