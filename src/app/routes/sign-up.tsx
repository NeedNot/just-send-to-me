import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  head: () => ({
    meta: seo({
      title: 'Sign up - JustSendToMe',
      description: 'Sign up form',
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
        <SignUpForm />
      </div>
    </>
  );
}
