import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link, useRouter } from '@tanstack/react-router';
import { useSignIn } from '../api/sign-in';
import type React from 'react';
import { ContinueWithGoogle } from './social-sign-in';
import { useState } from 'react';
import { VerifyOtpDialog } from './verify-otp-dialog';
import { useOTPVerification } from '../api/sign-up';
import { PasswordResetDialog } from './password-reset-dialog';

export function SignInForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] =
    useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { sendOTP, verifyOTP } = useOTPVerification({
    onVerificationSuccess() {
      const redirectTo = router.state.location.search.redirect ?? '/';
      router.navigate({ to: redirectTo });
    },
  });

  const signIn = useSignIn({
    onError: (error) => {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(error.email);
        return;
      }
      toast.error(error.message ?? 'Unable to sign in');
    },
    onSuccess: () => {
      const redirectTo = router.state.location.search.redirect ?? '/';
      router.navigate({ to: redirectTo });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const { email, password } = data as {
      email: string;
      password: string;
    };

    signIn.mutate({ email, password });
  };

  const handleVerify = async (otp: string, turnstileToken?: string) => {
    if (!turnstileToken) {
      throw Error('Unable to verify you are not a robot');
    }
    try {
      await verifyOTP({ email: pendingEmail, otp, turnstileToken });
    } catch (e: any) {
      if (e.code === 'INVALID_OTP') return false;
      throw e;
    }
    return true;
  };

  const handleResend = async () => {
    await sendOTP(pendingEmail);
  };

  return (
    <>
      <PasswordResetDialog
        open={showForgotPasswordDialog}
        onOpenChange={setShowForgotPasswordDialog}
      />
      <VerifyOtpDialog
        open={!!pendingEmail}
        onOpenChange={() => setPendingEmail('')}
        onResend={handleResend}
        onVerify={handleVerify}
        turnstileKey="0x4AAAAAAB6OHFZzfENBjn5f" //todo dont hard code
      />
      <Card {...props}>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <ContinueWithGoogle />
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                required
              />
              <div className="space-y-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Password"
                  required
                />
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPasswordDialog(true);
                  }}
                  href=""
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Button disabled={signIn.isPending}>Sign In</Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                to="/sign-up"
                search={{
                  redirect: router.state.location.search.redirect,
                }}
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
