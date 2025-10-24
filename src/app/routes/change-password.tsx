import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/change-password')({
  head: () => ({
    meta: [
      {
        title: 'Change password - JustSendToMe',
        description: 'Change your password',
        name: 'Change password',
      },
    ],
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
