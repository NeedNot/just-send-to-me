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
import { Pencil, Crown, LogOut } from 'lucide-react';
import React from 'react';

interface AccountCardProps {
  name: string;
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  foldersUsed?: number;
  maxFolders?: number;
  onSignOut?: () => void;
  onEditAccount?: () => void;
  onUpgrade?: () => void;
}

export function AccountCard({
  name,
  email,
  subscription,
  foldersUsed = 0,
  maxFolders = 0,
  onSignOut,
  onEditAccount,
  onUpgrade,
}: AccountCardProps & React.ComponentProps<typeof Card>) {
  const subscriptionConfig = {
    free: { label: 'Free', variant: 'secondary' as const },
    pro: { label: 'Pro', variant: 'default' as const },
    enterprise: { label: 'Enterprise', variant: 'default' as const },
  };

  const currentSubscription = subscriptionConfig[subscription];
  const folderUsagePercent = (foldersUsed! / maxFolders) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{name}</CardTitle>
              <Badge variant={currentSubscription.variant}>
                {currentSubscription.label}
              </Badge>
            </div>
            <CardDescription className="mt-1">{email}</CardDescription>
          </div>
          {subscription === 'free' && (
            <>
              <Button
                onClick={onEditAccount}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button onClick={onUpgrade} size="sm" className="ml-2">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Folders used</Label>
            <span className="text-muted-foreground text-sm">
              {foldersUsed} of {maxFolders} used
            </span>
          </div>
          <Progress value={folderUsagePercent} className="h-2" />
          <p className="text-muted-foreground text-xs">
            The longer the folder expiration time is the longer the folder
            counts against your account quota
          </p>
        </div>

        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full bg-transparent"
          size="lg"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
