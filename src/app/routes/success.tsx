import { ThankYou } from '@/features/billing/components/thank-you';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/success')({
  head: () => ({
    meta: seo({
      title: 'Payment successful - JustSendToMe',
      description: 'Thank you for your purchase',
    }),
  }),
  component: RouteComponent,
  validateSearch: (search) => ({
    session_id:
      typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
});

function RouteComponent() {
  const { session_id } = Route.useSearch();
  return (
    <div className="mx-auto w-full max-w-sm">
      <ThankYou sessionId={session_id} />
    </div>
  );
}
