import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

async function deleteAccount(password: string) {
  const { error } = await authClient.deleteUser({ password });
  if (error) {
    throw error;
  }
}

export function useDeleteAccount(
  mutationConfig: UseMutationOptions<
    void,
    { code?: string; message?: string },
    string
  > = {},
) {
  return useMutation({
    mutationFn: deleteAccount,
    ...mutationConfig,
  });
}
