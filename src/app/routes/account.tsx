import { Toaster } from 'sonner';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { MyFoldersCard } from '@/features/account/component/my-folders-card';
import { MyExpiredFoldersCard } from '@/features/account/component/my-expired-folders-card';
import { useMyFolders } from '@/features/account/api/my-folders';
import React from 'react';
import { AccountCard } from '@/features/account/component/account-card';
import { authClient } from '@/lib/better-auth';
import { Button } from '@/components/ui/button';
import { useMyAccount } from '@/features/account/api/my-account';

export const Route = createFileRoute('/account')({
  beforeLoad: async ({location}) => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({
        to: '/sign-in',
        search: {redirect: location.pathname}
      })
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: myFolders } = useMyFolders();
  // todo implement everything
  const account = useMyAccount();

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="grid grid-cols-1 items-start justify-center md:[grid-template-columns:minmax(auto,1fr)_minmax(300px,700px)_minmax(auto,1fr)]">
          <Sidebar
            current="account"
            items={['Account', 'My folders', 'My expired folders']}
            className="mr-[15%] ml-auto hidden min-w-48 justify-self-end md:block"
          />
          <div className="w-full max-w-2xl space-y-4 justify-self-center">
            {account && (
              <AccountCard/>
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
    <aside className={className}>
      <nav>
        <ul
          {...props}
          className="[&>li:not([aria-current=true])]:text-muted-foreground space-y-4 justify-self-end [&>[aria-current=true]]:font-bold [&>li]:before:border-l-2 [&>li]:before:text-primary [&>li]:before:pl-3 [&>li:not([aria-current=true])]:before:border-transparent"
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
      </nav>
    </aside>
  );
}
