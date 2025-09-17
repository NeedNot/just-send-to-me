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
            <Button>Continue with email</Button>
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

function ContinueWithGoogle() {
  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={(e) => e.preventDefault()}
      >
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Google</title>
          <path
            fill="currentColor"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          />
        </svg>
        Continue with Google
      </Button>
    </div>
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
        key={'abc'}
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
