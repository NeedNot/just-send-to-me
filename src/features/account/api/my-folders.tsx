import { MS_IN_MINUTE } from '@shared/constants';
import type { MyFoldersReponse } from '@shared/schemas';
import { useQuery } from '@tanstack/react-query';

export function useMyFolders() {
  const getFolders = async () => {
    const response = await fetch('/api/account/my-folders');
    if (!response.ok) {
      throw response;
    }
    return await response.json();
  };

  return useQuery<MyFoldersReponse>({
    queryFn: getFolders,
    queryKey: ['account', 'my-folders'],
    staleTime: 5*MS_IN_MINUTE
  });
}
