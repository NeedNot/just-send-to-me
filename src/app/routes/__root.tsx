import { SignUpPrompterProvider } from '@/features/auth/components/sign-up-prompter';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        <SignUpPrompterProvider>
          <Outlet />
          <TanStackRouterDevtools />
        </SignUpPrompterProvider>
      </>
    );
  },
});
