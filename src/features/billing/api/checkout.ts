import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
} from '@shared/schemas';
import { useMutation } from '@tanstack/react-query';

async function fetchCheckoutSession(
  params: CreateCheckoutSessionRequest,
): Promise<CreateCheckoutSessionResponse> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw response;
  }
  return await response.json();
}

export function useCheckout() {
  return useMutation({
    mutationFn: fetchCheckoutSession,
  });
}
