import { MS_IN_MINUTE } from '@shared/constants';
import type { SubscriptionResponse } from '@shared/schemas';
import { queryOptions, useQuery } from '@tanstack/react-query';

async function fetchSubscription(): Promise<SubscriptionResponse> {
  const response = await fetch('/api/billing/subscription');
  if (!response.ok) {
    throw response;
  }
  return response.json();
}

export const subscriptionQuery = queryOptions({
  queryFn: fetchSubscription,
  queryKey: ['account', 'billing', 'subscription'],
  staleTime: 5 * MS_IN_MINUTE,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export function useSubscription() {
  return useQuery(subscriptionQuery);
}
