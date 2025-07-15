import z from 'zod';
import type { Folder } from '@/api/types';
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Required'),
  expiration: z.enum(['week', 'fortnight'], 'Required'),
  retention: z.enum(['week', 'fortnight'], 'Required'),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  console.log(data);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return {
    id: '1',
    name: data.name,
    expiresAt: new Date(),
    deletesAt: new Date(),
    createdAt: new Date(),
    maxSize: 1024 ** 3,
    files: [],
    isOwnFolder: true,
  };
}

export function useCreateFolder(
  mutationConfig: UseMutationOptions<Folder, Error, CreateFolderInput> = {},
) {
  const queryClient = useQueryClient();

  const { onSuccess } = mutationConfig;

  return useMutation<Folder, Error, CreateFolderInput>({
    mutationFn: createFolder,
    onSuccess: (...args) => {
      queryClient.setQueryData(['folder', args[0].id], args[0]);
      queryClient.setQueryData(['myFolders'], (folders: string[] = []) => [
        ...folders,
        args[0].id,
      ]);
      onSuccess?.(...args);
    },
    ...mutationConfig,
  });
}
