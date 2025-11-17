import { createFileRoute } from '@tanstack/react-router';
import { CreateFolderForm } from '../../features/folder/components/create-folder-form';
import { seo } from '@/lib/seo';

export const Route = createFileRoute('/new')({
  head: () => ({
    meta: seo({
      title: 'Create new folder - JustSendToMe',
      description: 'Input a title and duration to create a new folder.',
    }),
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-sm">
          <CreateFolderForm />
        </div>
      </div>
    </>
  );
}
