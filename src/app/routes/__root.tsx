import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { myAccountQuery } from '@/features/account/api/my-account';
import { useSignOut } from '@/features/auth/api/sign-out';
import { queryClient } from '@/lib/query-client';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { Route as SignInRoute } from './sign-in';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  loader: () =>
    queryClient.ensureQueryData(myAccountQuery).catch(() => undefined),
  component: () => {
    const myAccount = Route.useLoaderData();
    const navigate = useNavigate();
    const { mutate: signOut } = useSignOut({
      onSuccess: () => {
        navigate({ to: SignInRoute.to, search: { redirect: '/account' } });
      },
    });
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
            onSignOut={() => signOut()}
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
