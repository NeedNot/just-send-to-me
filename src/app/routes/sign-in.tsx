import { SignInForm } from '@/features/auth/components/sign-in-form';
import { createFileRoute } from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createFileRoute('/sign-in')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <SignInForm />
        </div>
      </div>
      <Toaster />
    </>
  );
}
