import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateFolder } from '../api/create-folder';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';

export function CreateFolderForm() {
  const router = useRouter();
  const createFolder = useCreateFolder({
    onSuccess: (newFolder) => {
      toast.success('Folder created', {
        position: 'top-center',
      });
      router.navigate({ to: '/folder/' + newFolder.id });
    },
    onError(error) {
      toast.error('Unable to create folder', {
        description: error.message,
        position: 'top-center',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const expiration = formData.get('expiration') as 'week' | 'fortnight';
    const retention = formData.get('retention') as 'week' | 'fortnight';
    createFolder.mutate({ name, expiration, retention });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create new request folder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <label htmlFor="name">Name</label>
              <Input
                name="name"
                placeholder="Summer pictures" //todo have a random name generator
                type="text"
                required
              />
            </div>
            <div className="grid gap-3">
              <label htmlFor="expiration">Link valid for</label>
              <Select name="expiration" defaultValue="week">
                <SelectTrigger id="expiration" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="week">7 Days</SelectItem>
                    <SelectItem value="fortnight">14 Days</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <label htmlFor="retention">Delete files after</label>
              <Select name="retention" defaultValue="week">
                <SelectTrigger id="retention" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="week">7 Days</SelectItem>
                    <SelectItem value="fortnight">14 Weeks</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={createFolder.isPending} type="submit">
              Create
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            By creating a link you agree to our{' '}
            <a href="tos" className="underline underline-offset-4">
              Terms of Service
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
