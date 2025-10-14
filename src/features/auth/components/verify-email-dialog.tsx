import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useCooldown } from '@/hooks/use-cooldown';
import type React from 'react';
import { useOTPVerification } from '../api/sign-up';
import { useState } from 'react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

interface VerifyEmailDialogProps extends React.ComponentProps<typeof Dialog> {
  sendOnOpen: boolean;
  email: string;
  onVerificationSuccess?: () => void;
}

export function VerifyEmailDialog({
  email,
  sendOnOpen = true,
  onVerificationSuccess,
  ...props
}: VerifyEmailDialogProps) {
  const { timeLeft: cooldown, startCooldown } = useCooldown(60 * 1000);
  const [value, setValue] = useState('');
  const { sendOTP, checkOTP } = useOTPVerification({ onVerificationSuccess });

  const onSubmit = () => {
    if (value.length !== 6) return;
    checkOTP({ email, otp: value });
  };

  const resend = () => {
    if (!!cooldown) return;
    startCooldown();
    sendOTP(email);
  };

  return (
    <Dialog {...props}>
      <DialogContent
        onOpenAutoFocus={() => {
          if (sendOnOpen && cooldown === 0) {
            resend();
          }
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Verify your email address</DialogTitle>
          <DialogDescription>
            A 6 digit code has been sent to your email. If you don't see it
            check the spam folder or resend it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid justify-center gap-4">
          <InputOTP
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
            value={value}
            onChange={(v) => setValue(v)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          {value ? (
            <Button
              disabled={value.length !== 6}
              onClick={onSubmit}
              type="button"
            >
              Verify email
            </Button>
          ) : (
            <Button disabled={!!cooldown} onClick={resend} type="button">
              Resend {!!cooldown && `(${cooldown})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
