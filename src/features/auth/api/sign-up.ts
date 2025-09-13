import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export type EmailCredientals = {
  name: string;
  email: string;
  password: string;
};

async function signUp(credentials: EmailCredientals) {
  const { error } = await authClient.signUp.email({
    ...credentials,
  });
  if (error) {
    throw error;
  }
}

export function useSignUp(
  mutationConfig: UseMutationOptions<any, Error, EmailCredientals> = {},
) {
  return useMutation<any, Error, EmailCredientals>({
    mutationFn: signUp,
    ...mutationConfig,
  });
}
