import { Pricing2 } from '@/components/pricing2';
import { useMyAccount } from '@/features/account/api/my-account';
import { useCheckout } from '@/features/billing/api/checkout';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

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
    await checkout({ planId, interval: isYearly ? 'year' : 'month' }).then(
      ({ url }) => {
        window.location.href = url;
      },
    );
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
            text: account?.plan.id === 'FREE' ? 'Current' : 'Sign up',
            url: '/sign-up',
            current: account?.plan.id === 'FREE',
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
            text: 'Get started',
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
            text: 'Get started',
            onClick: () => subscribe('PRO'),
          },
        },
      ]}
      isYearly={isYearly}
      onIsYearlyChange={setIsYearly}
    />
  );
}
