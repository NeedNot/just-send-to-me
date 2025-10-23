import { createFileRoute } from '@tanstack/react-router';
import { FolderCard } from '../../features/folder/components/folder-card';
import { useGetFolder } from '../../features/folder/api/get-folder';

export const Route = createFileRoute('/f/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: folder } = useGetFolder({ folderId: id });
  return (
    <>
      <div className="mx-auto w-full max-w-xl">
        {folder ? (
          <FolderCard className="max-h-3/4" folder={folder} />
        ) : (
          <div>No folder</div>
        )}
      </div>
    </>
  );
}
