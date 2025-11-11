import { PlanCard } from '@/components/pricing2';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { myAccountQuery } from '@/features/account/api/my-account';
import { PlanManagmentCard } from '@/features/billing/components/subscription-management-card';
import { authClient } from '@/lib/better-auth';
import { queryClient } from '@/lib/query-client';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/account/subscription')({
  component: RouteComponent,
  loader: () =>
    queryClient.ensureQueryData(myAccountQuery).catch(() => undefined),
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
  const myAccount = Route.useLoaderData();
  const currentPlanId = myAccount?.plan.id || 'FREE';

  const planIds = SUBSCRIPTION_PLANS.map((plan) => plan.id);
  const [isYearly, setIsYearly] = useState(false);

  const changePlan = () => {};

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <PlanManagmentCard
        currentPlanId={currentPlanId}
        className="w-full max-w-2xl"
      />
      <h3 className="text-lg font-semibold">Change your plan</h3>
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
                button: {
                  text:
                    planIds.indexOf(plan.id) > planIds.indexOf('FREE')
                      ? 'Upgrade'
                      : 'Downgrade',
                  onClick: changePlan,
                },
              }}
              isYearly={isYearly}
            />
          ),
        )}
      </div>
    </div>
  );
}
