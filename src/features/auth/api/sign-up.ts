import { authClient } from '@/lib/better-auth';
import { useMutation } from '@tanstack/react-query';

function signUp(credentials: { email: string; password: string }) {
  return authClient.signUp.email({
    name: 'John Doe',
    ...credentials,
  });
}

export function useSignUp() {
  return useMutation<any, Error, { email: string; password: string }>({
    mutationFn: signUp,
  });
}
