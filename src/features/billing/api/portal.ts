import type { CreatePortalSessionResponse } from '@shared/schemas';
import { useMutation } from '@tanstack/react-query';

async function fetchPortalSession(): Promise<CreatePortalSessionResponse> {
  const response = await fetch('/api/billing/portal');
  if (!response.ok) {
    throw response;
  }
  return await response.json();
}

export function usePortal(onError?: (error: Error) => void) {
  return useMutation({
    mutationFn: fetchPortalSession,
    onError,
  });
}
