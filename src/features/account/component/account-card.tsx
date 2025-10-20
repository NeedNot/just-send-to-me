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
import { useMyAccount } from '../api/my-account';
import { authClient } from '@/lib/better-auth';
import { useNavigate } from '@tanstack/react-router';

interface AccountCardProps {
  onEditAccount?: () => void;
  onUpgrade?: () => void;
}

export function AccountCard({
  onEditAccount,
  onUpgrade,
}: AccountCardProps & React.ComponentProps<typeof Card>) {
  const { data } = useMyAccount();
  const navigate = useNavigate()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{data?.name}</CardTitle>
              <Badge variant="secondary">{data?.plan.name ?? 'Free'}</Badge>
            </div>
            <CardDescription className="mt-1">{data?.email}</CardDescription>
          </div>
          <Button
            onClick={onEditAccount}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {data?.plan.name === 'Free' ? (
            <Button onClick={onUpgrade} size="sm" className="ml-2">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          ) : (
            <Button className="ml-2" size="sm">
              Manage subscription
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Folders used</Label>
            <span className="text-muted-foreground text-sm">
              {data?.foldersUsed} of {data?.plan.maxFolders} used
            </span>
          </div>
          <Progress
            value={data ? (data?.foldersUsed / data?.plan.maxFolders) * 100 : 0}
            className="h-2"
          />
          <p className="text-muted-foreground text-xs">
            The longer the folder expiration time is the longer the folder
            counts against your account quota
          </p>
        </div>

        <Button
          onClick={() => {authClient.signOut(); navigate({to: '/sign-in', search: {redirect:  location.pathname}})}}
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
