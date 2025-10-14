import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCooldown } from '@/hooks/use-cooldown';
import { useEmailVerification } from '../api/sign-up';

export function VerifyEmailModal({
  email,
  ...props
}: { email: string } & React.ComponentProps<typeof Dialog>) {
  const { startCooldown, timeLeft } = useCooldown(60 * 1000);
  const { mutate: sendVerification } = useEmailVerification();

  const resendEmail = () => {
    startCooldown();
    sendVerification(email);
  };

  return (
    <Dialog {...props}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="min-w-full md:min-w-md"
      >
        <DialogHeader>
          <DialogTitle className="leading-6">
            Please verify your email
          </DialogTitle>
          <DialogDescription>
            If you don't have a verification link press resend
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <Button disabled={timeLeft > 0} onClick={resendEmail}>
            Resend email {timeLeft ? timeLeft : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
