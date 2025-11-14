import type { MyAccountResponse } from '@shared/schemas';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

async function deleteAccount(
  password: string,
): Promise<{ deletingAt: string }> {
  const response = await fetch('/api/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const data = await response.json();
    if (!response.ok) {
      throw Error(data.error);
    }
    return data;
  } catch (e) {
    throw Error(response.statusText, { cause: response.status });
  }
}

export function useDeleteAccount(
  mutationConfig: UseMutationOptions<
    { deletingAt: string },
    { code?: string; message?: string },
    string
  > = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    ...mutationConfig,
    onSuccess: (...args) => {
      queryClient.setQueryData(['account'], (prev: MyAccountResponse) => ({
        ...prev,
        deletingAt: args[0].deletingAt,
      }));
      mutationConfig?.onSuccess?.(...args);
    },
  });
}
