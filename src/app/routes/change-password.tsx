import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/change-password')({
  head: () => ({
    meta: seo({
      title: 'Change password - JustSendToMe',
      description: 'Change your password',
    }),
  }),
  component: RouteComponent,
  validateSearch: (search) => ({
    token: search.token as string | undefined,
  }),
});

function RouteComponent() {
  const token = Route.useSearch().token;
  return (
    <>
      <div className="mx-auto w-full max-w-sm">
        <ChangePasswordForm resetPasswordToken={token} />
      </div>
    </>
  );
}
