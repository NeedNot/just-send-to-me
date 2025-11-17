import { SignInForm } from '@/features/auth/components/sign-in-form';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: seo({
      title: 'Sign in - JustSendToMe',
      description: 'Sign in form',
    }),
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
