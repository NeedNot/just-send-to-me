import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Pencil, Crown, LogOut, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useMyAccount } from '../api/my-account';
import { EditAccountDialog } from './edit-account-dialog';
import { useSignOut } from '@/features/auth/api/sign-out';
import { useNavigate } from '@tanstack/react-router';
import { usePortal } from '@/features/billing/api/portal';
import { toast } from 'sonner';

interface AccountCardProps {
  onUpgrade?: () => void;
}

export function AccountCard({
  onUpgrade,
  ...props
}: AccountCardProps & React.ComponentProps<typeof Card>) {
  const { data } = useMyAccount();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate: signOut } = useSignOut({
    onSuccess: () => {
      navigate({ to: '/sign-in', search: { redirect: '/account' } });
    },
  });
  const { mutateAsync: getPortalSession, isPending: isPortalPending } =
    usePortal((e) =>
      toast.error('Unable to open billing portal', { description: e.message }),
    );

  const manageBilling = async () => {
    const { url } = await getPortalSession();
    window.location.href = url;
  };

  return (
    <>
      <EditAccountDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        name={data?.name ?? ''}
      />
      <Card {...props} className="w-full">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{data?.name}</CardTitle>
                <Badge variant="secondary">{data?.plan.name ?? 'Free'}</Badge>
              </div>
              <CardDescription className="mt-1">{data?.email}</CardDescription>
            </div>
            <Button
              onClick={() => setEditDialogOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {data?.plan.name === 'Free' ? (
              <Button onClick={onUpgrade} size="sm">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            ) : (
              <Button
                disabled={isPortalPending}
                onClick={manageBilling}
                size="sm"
              >
                {isPortalPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Manage subscription
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Credits</Label>
              <span className="text-muted-foreground text-sm">
                {data?.remainingCredits}/{data?.plan.credits}
              </span>
            </div>
            <Progress
              value={
                data
                  ? Math.min(1, data?.remainingCredits / data?.plan.credits) *
                    100
                  : 0
              }
              className="h-2"
            />
            <p className="text-muted-foreground text-xs">
              Credits are reapplied to your account 30d after they are spent
            </p>
          </div>

          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full bg-transparent"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
