import { createFileRoute } from '@tanstack/react-router';
import { CreateFolderForm } from '../../features/folder/components/create-folder-form';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{
      title: "Create new folder | JustSendToMe",
      description: "Input a title and duration to create a new folder.",
      name: "Create folder"
    }]
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
