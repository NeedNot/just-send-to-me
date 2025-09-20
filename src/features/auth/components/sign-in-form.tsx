import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';
import { useSignIn } from '../api/sign-in';
import type React from 'react';
import { ContinueWithGoogle } from './social-sign-in';

export function SignInForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();

  const signIn = useSignIn({
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      router.navigate({ to: '/' });
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

  return (
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
                placeholder="Password (At least 8 characters)"
                required
              />
              <a
                href="#"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Button disabled={signIn.isPending}>Sign In</Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="underline underline-offset-4">
              Sign up
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
