import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

async function signIn(credentials: { email: string; password: string }) {
  const { error } = await authClient.signIn.email({
    ...credentials,
  });
  if (error) {
    throw error;
  }
}

export function useSignIn(
  mutationConfig: UseMutationOptions<
    any,
    Error,
    { email: string; password: string }
  > = {},
) {
  return useMutation({
    mutationFn: signIn,
    ...mutationConfig,
  });
}
