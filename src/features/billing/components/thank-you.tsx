import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { FolderPlus, User } from 'lucide-react';

export function ThankYou() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="text-muted-foreground text-sm">
        Your payment has been processed successfully.
      </p>
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
