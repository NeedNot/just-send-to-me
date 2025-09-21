import { Toaster } from 'sonner';
import { createFileRoute } from '@tanstack/react-router';
import { MyFoldersCard } from '@/features/account/component/my-folders-card';

export const Route = createFileRoute('/account/my-folders')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-xl">
          <MyFoldersCard />
        </div>
      </div>
      <Toaster />
    </>
  );
}
