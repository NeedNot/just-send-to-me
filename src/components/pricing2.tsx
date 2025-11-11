'use client';

import { CircleCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from './ui/badge';
import { Link } from '@tanstack/react-router';

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  discount?: string;
  features: PricingFeature[];
  button: {
    text: string;
    url?: string;
    current?: boolean;
    onClick?: () => void;
  };
}

interface Pricing2Props {
  heading?: string;
  description?: string;
  plans: PricingPlan[];
  isYearly?: boolean;
  onIsYearlyChange?: (isYearly: boolean) => void;
}

const Pricing2 = ({
  heading = 'Pricing',
  description,
  plans,
  isYearly: controlledIsYearly,
  onIsYearlyChange,
}: Pricing2Props) => {
  const [uncontrolledIsYearly, setUncontrolledIsYearly] = useState(false);
  const isControlled = controlledIsYearly !== undefined;
  const isYearly = isControlled ? controlledIsYearly : uncontrolledIsYearly;
  const setIsYearly = isControlled ? onIsYearlyChange : setUncontrolledIsYearly;

  return (
    <section className="py-32">
      <div className="container">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
          <h2 className="text-4xl font-semibold text-pretty lg:text-5xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-lg">{description}</p>
          <div className="flex items-center gap-3 text-lg">
            Monthly
            <Switch
              checked={isYearly}
              onCheckedChange={() => setIsYearly?.(!isYearly)}
            />
            Yearly <Badge>2 months free</Badge>
          </div>
          <div className="flex flex-col flex-wrap items-stretch justify-center gap-6 md:flex-row">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="flex w-80 flex-col justify-between text-left"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <p>{plan.name}</p>
                    {plan.discount && (
                      <Badge variant="default">{plan.discount}</Badge>
                    )}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {plan.description}
                  </p>
                  <div className="flex items-end">
                    {plan.id !== 'custom' ? (
                      <>
                        <span className="text-4xl font-semibold">
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground text-2xl font-semibold">
                          {isYearly ? '/yr' : '/mo'}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-4xl font-semibold">
                        Custom
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CircleCheck className="size-4" />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button
                    asChild={!plan.button.onClick && !plan.button.current}
                    disabled={plan.button.current}
                    variant={plan.button.current ? 'outline' : 'default'}
                    onClick={plan.button.onClick}
                    className="w-full disabled:opacity-100"
                  >
                    {plan.button.onClick || plan.button.current ? (
                      plan.button.text
                    ) : (
                      <Link to={plan.button.url}>{plan.button.text}</Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <span>
            All prices in USD. Any plan can be customized, contact us for more
            details.
          </span>
          <span className="text-muted-foreground text-sm">
            * When you spend a credit, that credit is temporarily deducted from
            your balance for 30 days. After the 30-day period, the credit is
            automatically returned to your account for reuse.
          </span>
        </div>
      </div>
    </section>
  );
};

export { Pricing2 };
