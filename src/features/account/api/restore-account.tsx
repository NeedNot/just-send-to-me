import { useMutation, type MutateOptions } from '@tanstack/react-query';

async function restoreAccount() {
  const res = await fetch('/api/account/restore', {
    method: 'POST',
  });
  if (!res.ok) {
    throw res;
  }
  return;
}

export function useRestoreAccount(
  mutationConfig: MutateOptions<void, unknown, void> = {},
) {
  return useMutation({
    mutationFn: restoreAccount,
    onSuccess: () => {
      window.location.reload();
    },
    ...mutationConfig,
  });
}
