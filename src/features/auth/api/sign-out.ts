import { authClient } from '@/lib/better-auth';
import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

async function signOut() {
  const { error } = await authClient.signOut();
  if (error) {
    throw error;
  }
}

export function useSignOut(config: UseMutationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: (...data) => {
      queryClient.removeQueries({ queryKey: ['account'] });
      config?.onSuccess?.(...data)
    },
  });
}
