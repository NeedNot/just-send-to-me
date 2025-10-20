import { MS_IN_MINUTE } from '@shared/constants';
import type { MyAccountResponse } from '@shared/schemas';
import { useQuery } from '@tanstack/react-query';

async function getMyAccount(): Promise<MyAccountResponse> {
  const response = await fetch('/api/account');
  if (!response.ok) {
    throw response;
  }
  return await response.json();
}

export function useMyAccount() {
  return useQuery({
    queryFn: getMyAccount,
    queryKey: ['account'],
    staleTime: 5*MS_IN_MINUTE
  });
}
