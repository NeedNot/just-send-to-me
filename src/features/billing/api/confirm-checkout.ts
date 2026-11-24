import type { ConfirmCheckoutSessionResponse } from '@shared/schemas';
import { useQuery, useQueryClient } from '@tanstack/react-query';

async function confirmCheckout(
  sessionId: string,
): Promise<ConfirmCheckoutSessionResponse> {
  const response = await fetch('/api/billing/checkout/confirm', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw response;
  }
  return await response.json();
}

/**
 * Activates the plan bought in this checkout right away instead of waiting
 * for Stripe's webhook. Idempotent on the server, so retries are safe.
 */
export function useConfirmCheckout(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['billing', 'checkout', sessionId],
    queryFn: async () => {
      const result = await confirmCheckout(sessionId!);
      // the account (plan, credits) and subscription queries are now stale
      await queryClient.invalidateQueries({ queryKey: ['account'] });
      return result;
    },
    enabled: !!sessionId,
    // 409 = Stripe is still finalising the session: keep polling for ~30 s.
    // Anything else (404, 401) won't fix itself.
    retry: (failures, error) =>
      error instanceof Response && error.status === 409 && failures < 10,
    retryDelay: (attempt) => Math.min(1000 * 1.5 ** attempt, 5000),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
