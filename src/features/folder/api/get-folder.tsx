import type { Folder } from '@shared/schemas';
import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';


export async function getFolder(id: string): Promise<Folder> {
  const res = await fetch(`/api/folders/${id}`);
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
  return res.json();
}

export const folderQueryOptions = (id: string, queryConfig?: UseQueryOptions<Folder, Error>) => queryOptions({
  queryKey: ['folder', id],
  staleTime: 60 * 1000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  queryFn: () => getFolder(id),
  ...queryConfig
})

type UseFolderOptions = {
  folderId: string;
  queryConfig?: UseQueryOptions<Folder, Error>;
};

export function useGetFolder({ folderId, queryConfig }: UseFolderOptions) {
  return useQuery<Folder>(folderQueryOptions(folderId, queryConfig));
}
