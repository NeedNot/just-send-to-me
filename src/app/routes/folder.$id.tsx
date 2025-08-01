import { createFileRoute } from '@tanstack/react-router';
import { FolderCard } from '../../features/folder/components/folder-card';
import { useGetFolder } from '../../features/folder/api/get-folder';
import type { Folder } from '@shared/schemas';
import { Toaster } from 'sonner';

export const Route = createFileRoute('/folder/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const folder = useGetFolder({ folderId: id });
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-xl">
          <FolderCard folder={folder.data as Folder} />
        </div>
      </div>
      <Toaster />
    </>
  );
}
