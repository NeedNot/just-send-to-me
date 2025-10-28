import { Hero } from '@/features/landing-page/components/hero';
import { PricingBlock } from '@/features/landing-page/components/pricing-block';
import { Steps } from '@/features/landing-page/components/steps';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section id="hero">
        <Hero />
      </section>
      <section id="steps">
        <Steps />
      </section>
      <section id="pricing">
        <PricingBlock />
      </section>
    </div>
  );
}
