import { createFileRoute } from '@tanstack/react-router';
import { FolderCard } from '../../features/folder/components/folder-card';
import {
  folderQueryOptions,
  useGetFolder,
} from '../../features/folder/api/get-folder';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/f/$id')({
  loader: async ({ params }) =>
    queryClient.ensureQueryData(folderQueryOptions(params.id)),
  errorComponent: () => <div>Folder not found</div>, //todo
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name || 'Folder'} - JustSendToMe`,
        content: `${loaderData?.name} shared folder`,
        name: 'Shared folder',
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: folder } = useGetFolder({ folderId: id });
  return (
    <>
      <div className="mx-auto w-full max-w-xl">
        <FolderCard className="max-h-3/4" folder={folder!} />
      </div>
    </>
  );
}
