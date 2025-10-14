import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

async function signIn(credentials: { email: string; password: string }) {
  const { error } = await authClient.signIn.email({
    ...credentials,
  });
  if (error) {
    throw { ...error, email: credentials.email };
  }
}

export function useSignIn(
  mutationConfig: UseMutationOptions<
    any,
    {
      code?: string | undefined;
      message?: string | undefined;
      status: number;
      statusText: string;
    },
    { email: string; password: string }
  > = {},
) {
  return useMutation({
    mutationFn: signIn,
    ...mutationConfig,
  });
}
