import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { useOTPVerification, useSignUp } from '../api/sign-up';
import { toast } from 'sonner';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ContinueWithGoogle } from './social-sign-in';
import { VerifyOtpDialog } from './verify-otp-dialog';

export function SignUpForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [showEmailSignUpForm, setShowEmailSignUpForm] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const { sendOTP, verifyOTP } = useOTPVerification({
    onVerificationSuccess() {
      const redirectTo = router.state.location.search.redirect ?? '/';
      router.navigate({ to: redirectTo });
    },
  });
  const [emailInput, setEmailInput] = useState('');
  const router = useRouter();

  const signUp = useSignUp({
    onError: (error: Error) => {
      toast.error(error.message ?? 'Unable to sign up');
    },
    onSuccess: (data) => {
      if (!data.user.emailVerified) {
        setShowVerifyDialog(true);
        return;
      }
      const redirectTo = router.state.location.search.redirect ?? '/';
      router.navigate({ to: redirectTo });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!showEmailSignUpForm) {
      setShowEmailSignUpForm(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const { name, email, password } = data as {
      name: string;
      email: string;
      password: string;
    };

    signUp.mutate({ name, email, password });
  };

  const handleVerify = async (otp: string, turnstileToken?: string) => {
    if (!turnstileToken) {
      throw Error('Unable to verify you are not a robot');
    }
    try {
      await verifyOTP({ email: emailInput, otp, turnstileToken });
    } catch (e: any) {
      if (e.code === 'INVALID_OTP') return false;
      throw e;
    }
    return true;
  };

  const handleResend = async () => {
    await sendOTP(emailInput);
  };

  return (
    <>
      <VerifyOtpDialog
        open={showVerifyDialog}
        onOpenChange={setShowVerifyDialog}
        onResend={handleResend}
        onVerify={handleVerify}
        turnstileKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
      />
      <Card {...props}>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          {showEmailSignUpForm && (
            <CardDescription>
              <a
                href="#"
                onClick={() => setShowEmailSignUpForm(false)}
                className="flex items-center gap-1"
              >
                <ArrowLeft size={16} /> Go back
              </a>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {showEmailSignUpForm ? (
                <EmailSignUpForm value={emailInput} onChange={setEmailInput} />
              ) : (
                <>
                  <ContinueWithGoogle />
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <Input
                    autoComplete="off"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.currentTarget.value)}
                    required
                  />
                </>
              )}
              <Button disabled={signUp.isPending}>
                {!showEmailSignUpForm ? 'Continue with email' : 'Sign Up'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/sign-in"
                search={{
                  redirect: router.state.location.search.redirect,
                }}
                className="underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-4 text-center text-sm">
              By continuing, you agree to our{' '}
              <Link to="/legal" className="underline underline-offset-4">
                Terms of Service and Privacy Policy
              </Link>{' '}
              .
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function EmailSignUpForm({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Input
        id="email-2"
        autoComplete="off"
        name="email"
        type="email"
        placeholder="Email"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        required
      />
      <Input
        type="text"
        name="name"
        id="name"
        minLength={2}
        placeholder="Name"
        autoComplete="name"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        minLength={8}
        autoComplete="new-password"
        placeholder="Password (At least 8 characters)"
        required
      />
    </>
  );
}
