import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';
import type { SubscriptionResponse } from '@shared/schemas';
import { CircleCheck, ExternalLink, Loader2 } from 'lucide-react';
import type React from 'react';
import { usePortal } from '../api/portal';
import { toast } from 'sonner';

export interface PlanManagmentCardProps
  extends React.ComponentProps<typeof Card> {
  subscription: SubscriptionResponse;
}

export function PlanManagmentCard({
  subscription,
  ...props
}: PlanManagmentCardProps) {
  const { mutateAsync: getPortal, isPending: isPortalPending } = usePortal();

  const handleOpenPortal = async () => {
    try {
      const { url } = await getPortal();
      window.location.href = url;
    } catch (error: any) {
      toast.error('Unable to open billing portal', {
        description: error?.message,
      });
    }
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.id === (subscription.planId || 'FREE'),
  );
  return (
    <Card {...props}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Current plan</CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </div>
          <Badge variant="secondary">
            {subscription.planId === 'FREE'
              ? 'Free forever'
              : `${
                  subscription.cancelsAtPeriodEnd ? 'Ends on' : 'Renews on'
                } ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
          </Badge>
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
        <Button
          onClick={handleOpenPortal}
          disabled={isPortalPending}
          variant="default"
        >
          {isPortalPending ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <ExternalLink />
          )}
          Go to Stripe billing portal
        </Button>
      </CardContent>
    </Card>
  );
}
