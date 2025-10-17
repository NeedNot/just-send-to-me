import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export type ChangePasswordParams = {
  currentPassword: string;
  newPassword: string;
};

async function changePassword(params: ChangePasswordParams) {
  const { error } = await authClient.changePassword(params);
  if (error) {
    throw error;
  }
}

export function useChangePassword(
  mutationConfig?: UseMutationOptions<
    void,
    { code?: string; message?: string },
    any
  >,
) {
  return useMutation({
    mutationFn: changePassword,
    ...mutationConfig,
  });
}
