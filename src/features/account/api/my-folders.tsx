import type { Folder } from '@shared/schemas';
import { useQuery } from '@tanstack/react-query';

export function useMyFolders() {
  const getFolders = async () => {
    const response = await fetch('/api/account/my-folders');
    if (!response.ok) {
      throw response;
    }
    return await response.json();
  };

  return useQuery<Folder[]>({
    queryFn: getFolders,
    queryKey: ['account', 'my-folders'],
  });
}
