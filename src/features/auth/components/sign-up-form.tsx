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
import { useSignUp } from '../api/sign-up';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ContinueWithGoogle } from './social-sign-in';

export function SignUpForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [showEmailSignUpForm, setShowEmailSignUpForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const router = useRouter();

  const signUp = useSignUp({
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      router.navigate({ to: '/' });
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

  return (
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
            <a href="/sign-in" className="underline underline-offset-4">
              Sign In
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
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
