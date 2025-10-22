import { drizzle } from 'drizzle-orm/d1/driver';
import { files, folders } from './db/schema';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { app } from './hono';
import { UserCreditsObject } from './durable-objects/user-credits-object';
import { FolderFlow } from './workflows/folder-flow';

export default {
  scheduled: async (_, env, __) => {
    const db = drizzle(env.DB);
    const expiredFolderIds = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(lt(folders.expiresAt, new Date()), eq(folders.filesDeleted, false)),
      )
      .then((r) => r.map((f) => f.id));
    if (expiredFolderIds.length === 0) return;

    const expiredFiles = await db
      .select({ id: files.id, key: files.key })
      .from(files)
      .where(inArray(files.folderId, expiredFolderIds))
      .limit(1000);
    if (expiredFiles.length == 0) return;

    const chunkSize = 90;
    for (let i = 0; i < expiredFiles.length; i += chunkSize) {
      const batch = expiredFiles.slice(i, i + chunkSize);
      // delete objects
      await env.FILES_BUCKET.delete(batch.map((f) => f.key));
      // delete files
      await db.delete(files).where(
        inArray(
          files.id,
          batch.map((f) => f.id),
        ),
      );
    }
    // mark folder as deleted
    await db
      .update(folders)
      .set({ filesDeleted: true })
      .where(inArray(folders.id, expiredFolderIds));
  },
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;

export { UserCreditsObject, FolderFlow };
