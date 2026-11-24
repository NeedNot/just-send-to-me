import type { FolderView } from '@shared/schemas';
import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';

export async function getFolder(id: string): Promise<FolderView> {
  const res = await fetch(`/api/folders/${id}`);
  if (!res.ok) {
    throw Error(res.statusText, { cause: res.status });
  }
  return res.json();
}

export const folderQueryOptions = (
  id: string,
  queryConfig?: UseQueryOptions<FolderView, Error>,
) =>
  queryOptions({
    queryKey: ['folder', id],
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    queryFn: () => getFolder(id),
    ...queryConfig,
  });

type UseFolderOptions = {
  folderId: string;
  queryConfig?: UseQueryOptions<FolderView, Error>;
};

export function useGetFolder({ folderId, queryConfig }: UseFolderOptions) {
  return useQuery<FolderView>(folderQueryOptions(folderId, queryConfig));
}
