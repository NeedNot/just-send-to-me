import { Button } from '@/components/ui/button';
import { useConfirmCheckout } from '@/features/billing/api/confirm-checkout';
import { Link } from '@tanstack/react-router';
import { FolderPlus, Loader2, User } from 'lucide-react';

export function ThankYou({ sessionId }: { sessionId?: string }) {
  const confirm = useConfirmCheckout(sessionId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      {confirm.isLoading ? (
        <p className="text-muted-foreground flex items-center text-sm">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Activating your plan…
        </p>
      ) : confirm.isError ? (
        <p className="text-muted-foreground text-sm">
          Your payment went through, but we couldn&apos;t activate your plan
          yet. It should update within a few minutes; if it doesn&apos;t,
          contact support.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Your payment has been processed successfully
          {confirm.data?.active ? ' and your plan is active.' : '.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/account">
            <User className="mr-2 size-4" />
            Your account
          </Link>
        </Button>
        <Button asChild>
          <Link to="/new">
            <FolderPlus className="mr-2 size-4" />
            Create Folder
          </Link>
        </Button>
      </div>
    </div>
  );
}
