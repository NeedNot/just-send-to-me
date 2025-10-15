import { Toaster } from 'sonner';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { MyFoldersCard } from '@/features/account/component/my-folders-card';
import { MyExpiredFoldersCard } from '@/features/account/component/my-expired-folders-card';
import { useMyFolders } from '@/features/account/api/my-folders';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { AccountCard } from '@/features/account/component/account-card';
import { authClient } from '@/lib/better-auth';
import { Button } from '@/components/ui/button';
import { useMyAccount } from '@/features/account/api/my-account';

export const Route = createFileRoute('/account')({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { data: myFolders } = useMyFolders();
  const [current, setCurrent] = useState('');
  // todo implement everything
  const session = authClient.useSession();

  if (!session.data && !session.isPending) {
    router.navigate({ to: '/sign-in', search: { redirect: '/account' } });
  }

  const account = useMyAccount();

  return (
    <>
      <div className="bg-background flex min-h-screen justify-center">
        <div
          style={{
            gridTemplateColumns: 'minmax(230px, 1fr) 3fr  1fr',
          }}
          className="grid grid-cols-3 gap-6"
        >
          {/* sidebar */}
          <Sidebar
            current={current}
            items={['Account', 'Active folders', 'Expired folders', 'Danger']}
            className="w-full max-w-56 min-w-24 px-4"
          />
          <div className="w-full max-w-2xl min-w-xl space-y-4 justify-self-center">
            {account && (
              <AccountCard
                name={account.name}
                email={account.email}
                subscription={account.subscription as 'free'}
                maxFolders={account.quota.max}
                foldersUsed={account.quota.used}
                onSignOut={() => authClient.signOut()}
                onEditAccount={() => console.log('edit name')}
              />
            )}
            <MyFoldersCard
              id="active-folders"
              folders={myFolders?.folders ?? []}
            />
            <MyExpiredFoldersCard
              id="expired-folders"
              folders={myFolders?.expiredFolders ?? []}
            />
            <div className="m-auto w-min">
              <Button variant={'destructive'}>Delete account</Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export function Sidebar({
  current,
  items,
  className,
  ...props
}: { current: string; items: string[] } & React.ComponentProps<'ul'>) {
  return (
    <ul
      {...props}
      className={cn(
        '[&>li:not([aria-current=true])]:text-muted-foreground space-y-4 justify-self-end [&>[aria-current=true]]:font-bold [&>li]:before:border-l-2 [&>li]:before:pl-3 [&>li:not([aria-current=true])]:before:border-transparent',
        className,
      )}
    >
      {items.map((i) => (
        <li
          className="mt-8"
          aria-current={
            current.toLowerCase() === i.toLowerCase().replaceAll(' ', '-')
          }
        >
          <a href={`#${i.toLowerCase().replaceAll(' ', '-')}`}>{i}</a>
        </li>
      ))}
    </ul>
  );
}
