import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent,
  validateSearch: (search) => ({
    redirect: search.redirect as string | undefined,
  }),
});

function RouteComponent() {
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </div>
    </>
  );
}
