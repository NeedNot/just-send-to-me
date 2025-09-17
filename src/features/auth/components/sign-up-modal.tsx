import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SignUpForm } from './sign-up-form';
import { SignInForm } from './sign-in-form';

export function SignUpModal({ ...props }: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="min-w-full md:min-w-2xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {true ? (
            <SignUpForm className="order-2 min-w-64 sm:order-1" />
          ) : (
            <SignInForm className="order-2 min-w-64 sm:order-1" />
          )}
          <div className="order-1 flex flex-1 flex-col gap-3 px-6 py-6">
            <DialogHeader>
              <DialogTitle className="leading-6">
                Create an account to continue...
              </DialogTitle>
              <DialogDescription>
                You must be signed in to enjoy the following features
              </DialogDescription>
            </DialogHeader>
            <ul className="list-inside list-disc space-y-1 text-center sm:text-left">
              <li>Unlimited downloads</li>
              <li>Create up to 3 folders</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
