import { Pricing2 } from '@/components/pricing2';
import { useMyAccount } from '@/features/account/api/my-account';
import { useCheckout } from '@/features/billing/api/checkout';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export function PricingBlock() {
  const [isYearly, setIsYearly] = useState(true);
  const { data: account } = useMyAccount();
  const { mutateAsync: checkout } = useCheckout((e) => {
    toast.error('Unable to go to checkout', { description: e.message });
  });
  const navigate = useNavigate();
  const subscribe = async (planId: string) => {
    if (!account) {
      navigate({ to: '/sign-up', search: { redirect: undefined } }); //todo navigate to /subscribe
      return;
    }
    await checkout({ planId, duration: isYearly ? 'year' : 'month' }).then(
      ({ url }) => {
        window.location.href = url;
      },
    );
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
          id: 'free',
          name: 'Free',
          description: 'Free forever',
          monthlyPrice: '$0',
          yearlyPrice: '$0',
          features: [
            { text: '1 GB storage per folder' },
            { text: '3 credits per month*' },
            { text: '100 files per folder' },
          ],
          button: {
            text: getPlanText('FREE'),
            url: '/sign-up',
            current: !!account,
          },
        },
        {
          id: 'plus',
          name: 'Plus',
          discount: 'Limited time 50% off',
          description: 'Most common',
          monthlyPrice: '$1',
          yearlyPrice: '$10',
          features: [
            { text: '5 GB storage per folder' },
            { text: '10 credits per month*' },
            { text: '100 files per folder' },
          ],
          button: {
            text: getPlanText('PLUS'),
            current: account?.plan.id === 'PLUS',
            onClick: () => subscribe('PLUS'),
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Covers most use cases',
          monthlyPrice: '$5',
          yearlyPrice: '$50',
          features: [
            { text: '20 GB storage per folder' },
            { text: '25 credits per month*' },
            { text: '1000 files per folder' },
          ],
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
