import { SignUpModal } from '@/features/auth/components/sign-up-modal';
import { authClient } from '@/lib/better-auth';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useState } from 'react';

export const Route = createRootRoute({
  component: () => {
    const session = null;
    const [modalOpen, setModalOpen] = useState(!session);

    return (
      <>
        <Outlet />
        <SignUpModal open={modalOpen} onOpenChange={setModalOpen} />
        <TanStackRouterDevtools />
      </>
    );
  },
});
