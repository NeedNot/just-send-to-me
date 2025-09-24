import { Toaster } from 'sonner';
import { createFileRoute } from '@tanstack/react-router';
import { MyFoldersCard } from '@/features/account/component/my-folders-card';
import { MyExpiredFoldersCard } from '@/features/account/component/my-expired-folders-card';
import { useMyFolders } from '@/features/account/api/my-folders';

export const Route = createFileRoute('/account/my-folders')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: myFolders } = useMyFolders();
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex gap-6">
          {/* sidebar */}
          <div className="bg-sidebar-accent h-screen w-56">Side bar</div>
          <div className="space-y-4">
            <MyFoldersCard
              folders={myFolders?.folders ?? []}
              maxFolders={myFolders?.maxFolders ?? 0}
              className="h-min min-w-2xl"
            />
            <MyExpiredFoldersCard
              className="h-min min-w-2xl"
              folders={myFolders?.expiredFolders ?? []}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
