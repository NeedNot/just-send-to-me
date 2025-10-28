import { Pricing2 } from '@/components/pricing2';
import { useMyAccount } from '@/features/account/api/my-account';

export function PricingBlock() {
  const { data: account } = useMyAccount();
  return (
    <Pricing2
      description="Any plan can be customized, contact us for more details"
      plans={[
        {
          id: 'free',
          name: 'Free',
          description: 'Free forever',
          monthlyPrice: '$0',
          yearlyPrice: '$0',
          features: [
            { text: '1GB storage per folder' },
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
            { text: '5GB storage per folder' },
            { text: '10 credits per month*' },
            { text: '100 files per folder' },
          ],
          button: {
            text: 'Get started',
            url: '/sign-up',
          },
        },
        {
          id: 'pro',
          name: 'Pro',
          description: 'Covers most use cases',
          monthlyPrice: '$5',
          yearlyPrice: '$50',
          features: [
            { text: '20GB storage per folder' },
            { text: '25 credits per month*' },
            { text: '1000 files per folder' },
          ],
          button: {
            text: 'Get started',
            url: '/sign-up',
          },
        },
      ]}
    />
  );
}
