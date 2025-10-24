import { SignInForm } from '@/features/auth/components/sign-in-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      {
        title: 'Sign in - JustSendToMe',
        content: 'Sign in form',
        name: 'Sign in',
      },
    ],
  }),
  component: RouteComponent,
  validateSearch: (search) => ({
    redirect: search.redirect as string | undefined,
  }),
});

function RouteComponent() {
  return (
    <>
      <div className="mx-auto w-full max-w-sm">
        <SignInForm />
      </div>
    </>
  );
}
