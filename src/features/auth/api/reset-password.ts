import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export type ResetPasswordParams = {
  token: string;
  newPassword: string;
};

async function resetPassword(params: ResetPasswordParams) {
  const { error } = await authClient.resetPassword(params);
  if (error) {
    throw error;
  }
}

export async function requestPasswordReset(email: string) {
  const { error } = await authClient.requestPasswordReset({
    email,
  });
  if (error) {
    throw error;
  }
}

export function useResetPassword(
  mutationConfig?: UseMutationOptions<
    void,
    { code?: string; message?: string },
    any
  >,
) {
  return useMutation({
    mutationFn: resetPassword,
    ...mutationConfig,
  });
}

export function useRequestPasswordReset(
  mutationConfig?: UseMutationOptions<
    void,
    { code?: string; message?: string },
    any
  >,
) {
  return useMutation({
    mutationFn: requestPasswordReset,
    ...mutationConfig,
  });
}
