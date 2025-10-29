import { authClient } from '@/lib/better-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function signOut() {
  const { error } = await authClient.signOut();
  if (error) {
    throw error;
  }
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['account'] });
    },
  });
}
