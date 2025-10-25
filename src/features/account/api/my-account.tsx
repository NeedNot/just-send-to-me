import { MS_IN_MINUTE } from '@shared/constants';
import type { MyAccountResponse } from '@shared/schemas';
import { queryOptions, useQuery } from '@tanstack/react-query';

async function getMyAccount(): Promise<MyAccountResponse> {
  const response = await fetch('/api/account');
  if (!response.ok) {
    throw response
  }
  return await response.json();
}

export const myAccountQuery = queryOptions({
  queryFn: getMyAccount,
  queryKey: ['account'],
  staleTime: 5 * MS_IN_MINUTE,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export function useMyAccount() {
  return useQuery(myAccountQuery);
}
