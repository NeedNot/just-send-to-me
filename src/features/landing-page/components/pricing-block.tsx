import { Pricing2 } from '@/components/pricing2';
import { useMyAccount } from '@/features/account/api/my-account';
import { useCheckout } from '@/features/billing/api/checkout';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export function PricingBlock() {
  const [isYearly, setIsYearly] = useState(true);
  const { data: account } = useMyAccount();
  const { mutateAsync: checkout } = useCheckout();
  const navigate = useNavigate();
  const subscribe = async (planId: string) => {
    if (!account) {
      navigate({ to: '/sign-up', search: { redirect: undefined } }); //todo navigate to /subscribe
      return;
    }
    if (account.plan.id !== 'FREE') {
      navigate({ to: '/account/subscription' });
      return;
    }
    try {
      await checkout({ planId, duration: isYearly ? 'year' : 'month' }).then(
        ({ url }) => {
          window.location.href = url;
        },
      );
    } catch (e: any) {
      toast.error('Unable to go to checkout', { description: e.message });
    }
  };
  const currentPlanId = account?.plan.id;
  const plans = ['FREE', 'PLUS', 'PRO'];

  const getPlanText = (planId: string) => {
    if (!currentPlanId) return 'Get started';
    const index = plans.indexOf(planId);
    const currentIndex = plans.indexOf(currentPlanId);
    const diff = index - currentIndex;
    if (diff == 0) return 'Current';
    if (diff > 0) return 'Upgrade';
    return 'Current plan is better';
  };
  return (
    <Pricing2
      description="Save 15 minutes of hassle for just $1."
      plans={[
        {
          ...SUBSCRIPTION_PLANS.find((plan) => plan.id === 'FREE')!,
          button: {
            text: getPlanText('FREE'),
            url: '/sign-up',
            current: !!account,
          },
        },
        {
          ...SUBSCRIPTION_PLANS.find((plan) => plan.id === 'PLUS')!,
          button: {
            text: getPlanText('PLUS'),
            current: account?.plan.id === 'PLUS',
            onClick: () => subscribe('PLUS'),
          },
        },
        {
          ...SUBSCRIPTION_PLANS.find((plan) => plan.id === 'PRO')!,
          button: {
            text: getPlanText('PRO'),
            onClick: () => subscribe('PRO'),
          },
        },
      ]}
      isYearly={isYearly}
      onIsYearlyChange={setIsYearly}
    />
  );
}
