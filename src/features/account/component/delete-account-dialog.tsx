import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { useDeleteAccount } from '../api/delete-account';
import { DialogClose } from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCooldown } from '@/hooks/use-cooldown';
import { useSubscription } from '@/features/billing/api/subscription';

export function DeleteAccountDialog() {
  const { data: subscription } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { timeLeft, startCooldown } = useCooldown(10 * 1000);
  useEffect(() => {
    startCooldown();
  }, []);
  const { isPending, mutate } = useDeleteAccount({
    onSuccess: () => setIsOpen(false),
    onError: (e) => {
      toast.error('Unable to delete account', {
        description: e.message,
      });
    },
  });

  const hasSubscription =
    subscription &&
    subscription?.planId !== 'FREE' &&
    !subscription?.cancelsAtPeriodEnd;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!!timeLeft} variant="destructive">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 flex size-10 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive size-5" />
            </div>
            <DialogTitle className="text-xl">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-left leading-relaxed">
            Are you sure you want to delete your account? This action will start
            the account deletion process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                <Clock className="text-muted-foreground size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">30-Day Grace Period</p>
                <p className="text-muted-foreground text-sm">
                  Your account will be scheduled for deletion in 30 days. During
                  this time, your account will be deactivated. You will not be
                  able to use the service until it is reactivated.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                <HelpCircle className="text-muted-foreground size-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Changed Your Mind?</p>
                <p className="text-muted-foreground text-sm">
                  You can cancel the deletion by logging in and reactivating
                  your account within 30 days.
                </p>
              </div>
            </div>
          </div>

          <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-3">
            <p className="text-destructive text-sm font-medium">
              Warning: This will permanently delete all your data
            </p>
          </div>
          {hasSubscription && (
            <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-3">
              <p className="text-destructive text-sm font-medium">
                Error: You must cancel your subscription to delete your account
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Confirm your password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending || hasSubscription}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">
            Please enter your password to confirm this action.
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => mutate(password)}
            variant="destructive"
            disabled={isPending || password === ''}
          >
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
