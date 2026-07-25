import { authClient } from "@/lib/better-auth";
import type { MyAccountResponse } from "@shared/schemas";
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

async function editAccount(name: string) {
  const {error} = await authClient.updateUser({name})
  if (error) {
    throw error
  }
}

export function useEditAccount(mutationConfig?: UseMutationOptions<void, {code?: string; message?: string}, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: editAccount,
    ...mutationConfig,
    onSuccess(data, variables, onMutateResult, context) {
      queryClient.setQueryData(['account'], (prev: MyAccountResponse) => ({ ...prev, name: variables }));
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context)
    }
  })
}