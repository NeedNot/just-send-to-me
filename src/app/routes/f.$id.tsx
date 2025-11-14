import { createFileRoute, Link } from '@tanstack/react-router';
import { FolderCard } from '../../features/folder/components/folder-card';
import {
  folderQueryOptions,
  useGetFolder,
} from '../../features/folder/api/get-folder';
import { queryClient } from '@/lib/query-client';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { CircleAlert, ClockAlert, Unlink } from 'lucide-react';

export const Route = createFileRoute('/f/$id')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(folderQueryOptions(params.id)),
  errorComponent: ErrorComponent,
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

function ErrorComponent({ error }: { error: Error }) {
  const messages: Record<
    number,
    { icon: React.ReactNode; title: string; description: string }
  > = {
    404: {
      icon: <Unlink />,
      title: 'Folder Not Found',
      description: 'The folder you are looking for does not exist.',
    },
    410: {
      icon: <ClockAlert />,
      title: 'Folder Expired',
      description: 'The folder you are looking has expired.',
    },
  };
  const cause = Number(error.cause);
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {messages[cause]?.icon || <CircleAlert />}
        </EmptyMedia>
        <EmptyTitle>{messages[cause]?.title || 'An error occurred'}</EmptyTitle>
        <EmptyDescription>
          {messages[cause]?.description || error.message}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
          <Button variant="outline">
            <Link to="/new">Create new folder</Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
