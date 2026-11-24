import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from 'cloudflare:workers';
import { sendEmail } from '../lib/email';
import { drizzle } from 'drizzle-orm/d1/driver';
import { user } from '../db/auth-schema';
import { eq } from 'drizzle-orm';
import {
  deleteScheduledUser,
  deleteUserObjects,
} from '../repositories/account-repository';
import { DeleteAccountConfirmation } from '../email-templates/delete-account-confirmation';
import { NonRetryableError } from 'cloudflare:workflows';

export interface DeleteAccountWorkflowPayload {
  userId: string;
  updatedAt: string;
}

export class DeleteAccountWorkflow extends WorkflowEntrypoint<
  Env,
  DeleteAccountWorkflowPayload
> {
  async run(
    event: Readonly<WorkflowEvent<DeleteAccountWorkflowPayload>>,
    step: WorkflowStep,
  ) {
    console.log('Deleting account', event.payload.userId);
    await step.do('Send warning email', async () => {
      const { email, updatedAt } =
        (await this.getUserEmail(event.payload.userId)) || {};
      if (!email) {
        throw new NonRetryableError(
          'No email found for user ' + event.payload.userId,
        );
      }
      if (
        updatedAt?.getTime() !== new Date(event.payload.updatedAt).getTime()
      ) {
        throw new NonRetryableError(
          `User ${event.payload.userId} has been updated since this was triggered ${updatedAt?.getTime()} -> ${new Date(event.payload.updatedAt).getTime()}`,
        );
      }
      await sendEmail(
        email,
        'ATTENTION! Your account is about to be deleted',
        DeleteAccountConfirmation(30),
      );
    });

    await step.sleep('Wait 27 days', '27 days');

    await step.do('Send 3 day warning email', async () => {
      const { email, updatedAt } =
        (await this.getUserEmail(event.payload.userId)) || {};
      if (!email) {
        throw new NonRetryableError(
          'No email found for user ' + event.payload.userId,
        );
      }
      if (
        updatedAt?.getTime() !== new Date(event.payload.updatedAt).getTime()
      ) {
        throw new NonRetryableError(
          'User ' +
            event.payload.userId +
            ' has been updated since this was triggered',
        );
      }
      await sendEmail(
        email,
        'ATTENTION! Your account is about to be deleted',
        DeleteAccountConfirmation(3),
      );
    });

    await step.sleep('Wait 3 days', '3 days');

    const deletedUser = await step.do('Delete account', async () => {
      // folders/files/subscriptions don't cascade, so they're removed in the
      // same batch as the user row (see deleteScheduledUser)
      const db = drizzle(this.env.DB);
      const deleted = await deleteScheduledUser(db, {
        userId: event.payload.userId,
        updatedAt: new Date(event.payload.updatedAt),
      });
      return deleted ? { id: deleted.id } : null;
    });

    await step.do('Delete stored files', async () => {
      if (!deletedUser) return 0;
      return deleteUserObjects(this.env.FILES_BUCKET, event.payload.userId);
    });

    await step.do('Delete user credits object', async () => {
      if (deletedUser) {
        console.log('Deleted user row', deletedUser);
      } else {
        console.log('No user to delete');
        return;
      }
      console.log('deleting user credits object');
      const stub = this.env.USER_CREDITS_OBJECT.getByName(event.payload.userId);
      await stub.deleteStorage();
    });
  }
  getUserEmail(id: string) {
    return drizzle(this.env.DB)
      .select({ email: user.email, updatedAt: user.updatedAt })
      .from(user)
      .where(eq(user.id, id))
      .get();
  }
}
