import { createFileRoute } from '@tanstack/react-router';
import { CreateFolderForm } from '../../features/folder/components/create-folder-form';
import { Toaster } from 'sonner';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <CreateFolderForm />
        </div>
      </div>
      <Toaster />
    </>
  );
}
