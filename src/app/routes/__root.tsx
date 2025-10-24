import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { myAccountQuery } from '@/features/account/api/my-account';
import { queryClient } from '@/lib/query-client';
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  loader: () => queryClient.ensureQueryData(myAccountQuery),
  component: () => {
    const myAccount = Route.useLoaderData();
    return (
      <>
        {/* <SignUpPrompterProvider> */}
        <HeadContent />
        <div className="bg-background flex min-h-screen flex-col gap-4">
          <Navbar
            user={
              myAccount && {
                ...myAccount,
                credits: myAccount?.remainingCredits,
                maxCredits: myAccount?.plan.credits,
              }
            }
          />
          <div className="my-auto">
            <Outlet />
          </div>
          <Footer />
        </div>
        <TanStackRouterDevtools />
        {/* </SignUpPrompterProvider> */}
      </>
    );
  },
});
