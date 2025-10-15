'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { AlertCircle } from 'lucide-react';
import { useCooldown } from '@/hooks/use-cooldown';
import { Turnstile } from '@marsidev/react-turnstile';

interface VerifyOtpDialogProps {
  open: boolean;
  sendOnOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify?: (
    otp: string,
    turnstileToken?: string,
  ) => Promise<boolean> | boolean;
  onResend?: () => Promise<void> | void;
  turnstileKey?: string;
}

export function VerifyOtpDialog({
  open,
  sendOnOpen = true,
  onOpenChange,
  onVerify,
  onResend,
  turnstileKey,
}: VerifyOtpDialogProps) {
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const { timeLeft: cooldown, startCooldown } = useCooldown(60000);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Send OTP when dialog opens
  useEffect(() => {
    if (open) {
      sendOnOpen && handleResend();
    } else {
      setOtp('');
      setError('');
    }
  }, [open]);

  const handleResend = async () => {
    if (cooldown === 0) {
      try {
        await onResend?.();
        startCooldown();
      } catch (e) {
        // todo if status is 429 apply cooldown
        setError('Error sending verification code. Please try again');
      }
      setOtp('');
      setError('');
    }
  };

  const handleComplete = async (value: string) => {
    if (!token && turnstileKey) return;
    setError('');
    setIsVerifying(true);

    try {
      const isValid = await onVerify?.(value, token ? token : undefined);

      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setOtp('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (value: string) => {
    setOtp(value);
    if (error) {
      setError('');
    }
  };

  const handleTurnstileSuccess = (token: string) => {
    setToken(token);
    if (otp.length === 6) handleComplete(otp);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Verify Your Email
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter the 6-digit code sent to your email
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-4">
          {/* OTP Input */}
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              autoComplete="off"
              maxLength={6}
              value={otp}
              onChange={handleChange}
              onComplete={handleComplete}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {turnstileKey && (
              <Turnstile
                onSuccess={handleTurnstileSuccess}
                onExpire={() => setToken('')}
                onError={(e) => setError(e)}
                siteKey={turnstileKey}
              />
            )}

            {error && (
              <div className="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Resend Section */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {"Didn't receive the code?"}
            </span>
            {cooldown > 0 ? (
              <span className="text-muted-foreground font-medium">
                Resend in {cooldown}s
              </span>
            ) : (
              <Button
                variant="link"
                onClick={handleResend}
                className="h-auto p-0 font-medium"
              >
                Resend Code
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
