import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useChangePassword,
  type ChangePasswordParams,
} from '../api/change-password';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';
import {
  useResetPassword,
  type ResetPasswordParams,
} from '../api/reset-password';

export interface ChangePasswordFormProps
  extends React.ComponentProps<typeof Card> {
  resetPasswordToken?: string;
}

export function ChangePasswordForm({
  resetPasswordToken,
  ...props
}: ChangePasswordFormProps) {
  const router = useRouter();

  const { mutate: changePassword, isPending: isChangePending } =
    useChangePassword({
      onError: (e) => {
        toast.error(e.message ?? 'Unable to change password');
      },
      onSuccess: () => {
        toast.success('Password changed successfully');
        router.navigate({ to: '/account' });
      },
    });
  const { mutate: resetPasswordMutation, isPending: isResetPending } =
    useResetPassword({
      onError: (e) => {
        toast.error(e.message ?? 'Unable to reset password');
      },
      onSuccess: () => {
        toast.success('Password reset successfully');
        router.navigate({ to: '/sign-in', search: { redirect: '/account' } });
      },
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data['confirm-password']) {
      toast.error('Passwords do not match');
      return;
    }
    if (!!resetPasswordToken) {
      const params = {
        token: router.state.location.search.token as string,
        newPassword: data.password,
      } as ResetPasswordParams;
      resetPasswordMutation(params);
      return;
    }
    changePassword({
      currentPassword: data['old-password'],
      newPassword: data.password,
    } as ChangePasswordParams);
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>
          {resetPasswordToken ? 'Reset password' : 'Change password'}
        </CardTitle>
        <CardDescription>
          Password should be at least 8 characters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {!resetPasswordToken && (
              <Input
                id="old-password"
                name="old-password"
                type="password"
                autoComplete="current-password"
                placeholder="Current password"
                required
              />
            )}
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="New password"
              required
            />
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm password"
              required
            />
            <Button disabled={isChangePending || isResetPending}>
              {resetPasswordToken ? 'Reset password' : 'Change password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
