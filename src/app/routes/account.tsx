import { Toaster } from 'sonner';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { MyFoldersCard } from '@/features/account/component/my-folders-card';
import { MyExpiredFoldersCard } from '@/features/account/component/my-expired-folders-card';
import { useMyFolders } from '@/features/account/api/my-folders';
import React, { useEffect, useState } from 'react';
import { AccountCard } from '@/features/account/component/account-card';
import { authClient } from '@/lib/better-auth';

export const Route = createFileRoute('/account')({
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: myFolders } = useMyFolders();

  return (
    <>
      <div className="bg-background min-h-screen">
        <div>
          {/* <div className="[grid-template-columns:minmax(auto,1fr)_minmax(300px,700px)_minmax(auto,1fr)] items-start justify-center md:grid"> */}
          {/* <TableOfContents
            current="account"
            className="mr-[15%] ml-auto hidden min-w-48 justify-self-end md:block"
          /> */}
          <div
            id="content"
            className="mx-auto w-full max-w-2xl space-y-4 justify-self-center"
          >
            <AccountCard id="account" data-section="Account" />
            <MyFoldersCard
              id="active-folders"
              data-section="Active folders"
              folders={myFolders?.folders ?? []}
            />
            <MyExpiredFoldersCard
              id="expired-folders"
              data-section="Expired folders"
              folders={myFolders?.expiredFolders ?? []}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export function TableOfContents({
  current,
  className,
  ...props
}: { current: string } & React.ComponentProps<'ul'>) {
  const [sections, setSections] = useState<{ text: string; href: string }[]>(
    [],
  );

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll('[data-section][id]'),
    ).map((e) => ({
      text: e.getAttribute('data-section')!,
      href: e.getAttribute('id')!,
    }));
    setSections(elements);
  }, []);

  return (
    <aside className={className}>
      <nav>
        <ul
          {...props}
          className="[&>li:not([aria-current=true])]:text-muted-foreground [&>li]:before:text-primary space-y-4 justify-self-end [&>[aria-current=true]]:font-bold [&>li]:before:border-l-2 [&>li]:before:pl-3 [&>li:not([aria-current=true])]:before:border-transparent"
        >
          {sections.map((s) => (
            <li
              key={s.href}
              className="mt-8"
              aria-current={current.toLowerCase() === s.href}
            >
              <a
                href={`#${s.href}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector(`#${s.href}`)
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {s.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
