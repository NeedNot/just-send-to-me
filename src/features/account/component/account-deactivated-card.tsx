import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface AccountDeactivatedCardProps {
  deletingAt: string;
  onReactivate: () => void;
}

export function AccountDeactivatedCard({
  deletingAt,
  onReactivate,
}: AccountDeactivatedCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleReactivateClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmReactivation = () => {
    onReactivate();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card className="border-destructive/50 max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            <CardTitle className="text-xl">
              Account Scheduled for Deletion
            </CardTitle>
          </div>
          <CardDescription>
            Your account is currently deactivated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-md p-4">
            <p className="text-foreground text-sm">
              Your account is set to be permanently deleted on{' '}
              <span className="text-destructive font-semibold">
                {deletingAt}
              </span>
              .
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Until then, you can restore your account and all your data by
            clicking the button below.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleReactivateClick}
            className="w-full"
            variant="default"
          >
            Reactivate my account
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Account Reactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate your account? This will cancel
              the scheduled deletion and restore full access to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReactivation}>
              Yes, Reactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
