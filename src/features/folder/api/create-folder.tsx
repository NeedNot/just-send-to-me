import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { type CreateFolderInput, type Folder } from '@shared/schemas';

export async function createFolder(data: CreateFolderInput) {
  const res = await fetch('/api/folders/new', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let error: Error;
    try {
      const err = await res.json();
      error = Error(err.message, { cause: err.code });
    } catch (e) {
      error = Error(res.statusText, { cause: res.status });
    }
    throw error;
  }
  return await res.json();
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
