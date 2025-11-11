export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  discount?: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: 'Free',
    description: 'Free forever',
    priceMonthly: '$0',
    priceYearly: '$0',
    features: [
      '1 GB per folder',
      '3 Credits per month*',
      '100 files per folder',
    ],
  },
  {
    id: 'PLUS',
    name: 'Plus',
    description: 'Most common',
    discount: 'Limited time 50% off',
    priceMonthly: '$1',
    priceYearly: '$10',
    features: [
      '5 GB storage per folder',
      '10 credits per month*',
      '100 files per folder',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Covers most use cases',
    priceMonthly: '$5',
    priceYearly: '$50',
    features: [
      '20 GB storage per folder',
      '25 credits per month*',
      '1000 files per folder',
    ],
  },
];
