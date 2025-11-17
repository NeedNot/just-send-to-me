import { PlanCard } from '@/components/pricing2';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCheckout } from '@/features/billing/api/checkout';
import {
  subscriptionQuery,
  useSubscription,
} from '@/features/billing/api/subscription';
import { PlanManagmentCard } from '@/features/billing/components/subscription-management-card';
import { authClient } from '@/lib/better-auth';
import { queryClient } from '@/lib/query-client';
import { seo } from '@/lib/seo';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/account/subscription')({
  head: () => ({
    meta: seo({
      title: 'Manage subscription - JustSendToMe',
      description: 'Manage your subscription',
    }),
  }),
  component: RouteComponent,
  loader: () => queryClient.ensureQueryData(subscriptionQuery),
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname },
      });
    }
  },
});

function RouteComponent() {
  const { data: mySubscription } = useSubscription();
  const currentPlanId = mySubscription?.planId || 'FREE';
  const { mutateAsync: checkout } = useCheckout();

  const goToCheckout = async (planId: string) => {
    try {
      await checkout({
        planId: planId,
        duration: isYearly ? 'year' : 'month',
      }).then(({ url }) => {
        window.location.href = url;
      });
    } catch (error) {
      console.error(error);
    }
  };

  const [isYearly, setIsYearly] = useState(false);

  if (!mySubscription) {
    // should never happen
    return redirect({ to: '/account' });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <PlanManagmentCard
        subscription={mySubscription}
        className="w-full max-w-2xl"
      />
      <h3 className="text-lg font-semibold">Other plans</h3>
      <div className="flex items-center gap-3 text-lg">
        Monthly
        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
        Yearly <Badge>2 months free</Badge>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {SUBSCRIPTION_PLANS.filter((plan) => plan.id !== currentPlanId).map(
          (plan) => (
            <PlanCard
              key={plan.id}
              plan={{
                ...plan,
                button:
                  currentPlanId === 'FREE'
                    ? {
                        text: 'Subscribe',
                        onClick: () => goToCheckout(plan.id),
                      }
                    : undefined,
              }}
              isYearly={isYearly}
            />
          ),
        )}
      </div>
    </div>
  );
}
