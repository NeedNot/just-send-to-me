import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from 'cloudflare:workers';
import { sendEmail } from '../lib/email';
import { drizzle } from 'drizzle-orm/d1/driver';
import { user } from '../db/auth-schema';
import { and, eq, lt } from 'drizzle-orm';
import { MS_IN_DAY } from '../../shared/constants';
import { DeleteAccountConfirmation } from '../email-templates/delete-account-confirmation';

export class DeleteAccountWorkflow extends WorkflowEntrypoint<
  Env,
  { id: string }
> {
  async run(
    event: Readonly<WorkflowEvent<{ id: string }>>,
    step: WorkflowStep,
  ) {
    console.log('Deleting account', event.payload.id);
    await step.do('Mark set deletion date', async () => {
      const db = drizzle(this.env.DB);
      await db
        .update(user)
        .set({
          deleting_at: new Date(Date.now() + MS_IN_DAY * 30),
          updatedAt: new Date(),
        })
        .where(eq(user.id, event.payload.id));
    });
    await step.do('Send warning email', async () => {
      const email = await this.getUserEmail(event.payload.id);
      if (!email) {
        console.log('No email found for user', event.payload.id);
        return;
      }
      sendEmail(
        email,
        'ATTENTION! Your account is about to be deleted',
        DeleteAccountConfirmation(3),
      );
    });

    await step.sleep('Wait 27 days', '27 days');

    await step.do('Send 3 day warning email', async () => {
      const email = await this.getUserEmail(event.payload.id);
      if (!email) {
        console.log('No email found for user', event.payload.id);
        return;
      }
      sendEmail(
        email,
        'ATTENTION! Your account is about to be deleted',
        DeleteAccountConfirmation(3),
      );
    });

    await step.sleep('Wait 3 days', '3 days');

    await step.do('Delete account', async () => {
      // folders should already be expired, so we can just delete the user and relations will clean everything out
      const db = drizzle(this.env.DB);
      const deletedUser = await db
        .delete(user)
        .where(
          and(eq(user.id, event.payload.id), lt(user.deleting_at, new Date())),
        )
        .returning()
        .get();
      if (deletedUser) {
        const stub = this.env.USER_CREDITS_OBJECT.getByName(event.payload.id);
        await stub.deleteStorage();
      }
    });
  }
  getUserEmail(id: string) {
    return drizzle(this.env.DB)
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, id))
      .get()
      .then((user) => user?.email);
  }
}
