import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        if (error instanceof Response) {
          return error.status !== 401;
        }

        return count < 3;
      },
    },
  },
});
