import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/change-password')({
  component: RouteComponent,
  validateSearch: (search) => ({
    token: search.token as string | undefined,
  }),
});

function RouteComponent() {
  const token = Route.useSearch().token;
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <ChangePasswordForm resetPasswordToken={token} />
        </div>
      </div>
    </>
  );
}
