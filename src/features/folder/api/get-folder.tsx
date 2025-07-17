import type { Folder } from '@shared/schemas';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export async function getFolder(id: string): Promise<Folder> {
  return await fetch(`/api/folders/${id}`).then((res) => res.json());
}

type UseFolderOptions = {
  folderId: string;
  queryConfig?: UseQueryOptions<Folder, Error>;
};

export function useGetFolder({ folderId, queryConfig }: UseFolderOptions) {
  return useQuery<Folder>({
    queryKey: ['folder', folderId],
    queryFn: () => getFolder(folderId),
    ...queryConfig,
  });
}
