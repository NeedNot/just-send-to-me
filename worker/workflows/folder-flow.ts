import { WorkflowEntrypoint } from "cloudflare:workers";
import { MS_IN_DAY } from "../../shared/constants";
import { drizzle } from "drizzle-orm/d1/driver";
import { files, folders } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

type Params = {
  folderId: string;
  creditCost: number;
  expiresAt: string
}

export class FolderFlow extends WorkflowEntrypoint<Env, Params> {
  async run(event: Readonly<CloudflareWorkersModule.WorkflowEvent<Params>>, step: CloudflareWorkersModule.WorkflowStep) {
    // sleep till expiration
    await step.sleepUntil('Folder expiration', new Date(event.payload.expiresAt))
    await step.do('Delete files', async () => {
      const db = drizzle(this.env.DB)
      const expiredFiles = await db
        .select({ id: files.id, key: files.key })
        .from(files)
        .where(eq(files.folderId, event.payload.folderId)).all()

      const chunkSize = 90;
      if (expiredFiles.length > 0) {
        for (let i = 0; i < expiredFiles.length; i += chunkSize) {
          const batch = expiredFiles.slice(i, i + chunkSize);
          // delete objects
          await this.env.FILES_BUCKET.delete(batch.map((f) => f.key));
          // delete files
          await db.delete(files).where(
            inArray(
              files.id,
              batch.map((f) => f.id),
            ),
          );
        }
      }
      await db
        .update(folders)
        .set({ filesDeleted: true })
        .where(eq(folders.id, event.payload.folderId));
    })

    // add credits back
    await step.sleepUntil('30d after folder created', new Date(Date.now() + (MS_IN_DAY * 30)))
    await step.do('Reapply credits', async () => {
      const objectId = this.env.USER_CREDITS_OBJECT.idFromString(event.payload.folderId)
      const stub = this.env.USER_CREDITS_OBJECT.get(objectId)
      stub.addCredits(event.payload.creditCost)
    })
  }
}