import { ThankYou } from '@/features/billing/components/thank-you';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/success')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <ThankYou />
    </div>
  );
}
