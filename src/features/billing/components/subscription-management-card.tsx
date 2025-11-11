import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import { CircleCheck, ExternalLink } from 'lucide-react';
import type React from 'react';

export interface PlanManagmentCardProps
  extends React.ComponentProps<typeof Card> {
  currentPlanId: string;
}

export function PlanManagmentCard({
  currentPlanId,
  ...props
}: PlanManagmentCardProps) {
  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.id === currentPlanId,
  );
  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Current plan</CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h2 className="text-2xl font-bold">{currentPlan?.name}</h2>
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm font-medium">
            Plan features
          </p>
          <ul className="space-y-2">
            {currentPlan?.features?.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CircleCheck className="size-4" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="default">
          <ExternalLink />
          Go to Stripe billing portal
        </Button>
      </CardContent>
    </Card>
  );
}
