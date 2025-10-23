import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  head: () => ({
    meta: [{
      title: "Sign up | JustSendToMe",
      content: "Sign up form",
      name: "Sign up"
    }]
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
