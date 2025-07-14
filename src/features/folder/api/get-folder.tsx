import type { Folder, File } from '@/api/types';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export async function getFolder(id: string): Promise<Folder> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    id,
    name: 'Test folder',
    maxSize: 1024 ** 3,
    expiresAt: new Date(),
    deletesAt: new Date(),
    createdAt: new Date(),
    files: [
      { id: '1', name: 'myfile.png', folderId: id, size: 1024 } as File,
      {
        id: '2',
        name: 'myfile.mp4',
        folderId: id,
        size: 1024 ** 3 / 2,
      } as File,
    ],
  };
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
