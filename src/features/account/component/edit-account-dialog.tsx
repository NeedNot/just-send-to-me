import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useEditAccount } from '../api/edit-account';
import { toast } from 'sonner';
import { DeleteAccountDialog } from './delete-account-dialog';

interface EditAccountDialogProps extends React.ComponentProps<typeof Dialog> {
  name: string;
}

export function EditAccountDialog({
  name,
  open,
  onOpenChange,
}: EditAccountDialogProps) {
  const [newName, setNewName] = useState('');
  const { mutate: saveAccount, isPending } = useEditAccount({
    onSuccess: () => onOpenChange?.(false),
    onError(e) {
      toast.error('Failed to update account', { description: e.message });
    },
  });

  useEffect(() => setNewName(open ? name : ''), [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Make changes to your account here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your new account name"
            />
          </div>
          <div className="space-y-4">
            <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-4">
              <h2 className="text-destructive mb-2 font-medium">Danger Zone</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <DeleteAccountDialog />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Link to="/change-password" search={{ token: undefined }}>
            <Button variant="link" className="w-full">
              Change Password
              <ArrowUpRight />
            </Button>
          </Link>
          <Button
            disabled={isPending || name === newName || newName.length < 1}
            type="submit"
            onClick={() => saveAccount(newName)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
