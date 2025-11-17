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
});

function RouteComponent() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <ThankYou />
    </div>
  );
}
