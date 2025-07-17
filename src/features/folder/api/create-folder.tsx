import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { type CreateFolderInput, type Folder } from '@shared/schemas';

export async function createFolder(data: CreateFolderInput): Promise<Folder> {
  return await fetch('/api/folders/new', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }).then((res) => res.json());
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
      onSuccess?.(...args);
    },
    ...mutationConfig,
  });
}
