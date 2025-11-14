import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import {
  myAccountQuery,
  useMyAccount,
} from '@/features/account/api/my-account';
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
import { AccountDeactivatedCard } from '@/features/account/component/account-deactivated-card';
import { useRestoreAccount } from '@/features/account/api/restore-account';
import { toast } from 'sonner';

export const Route = createRootRoute({
  loader: () =>
    queryClient.ensureQueryData(myAccountQuery).catch(() => undefined),
  component: () => {
    const { data: myAccount } = useMyAccount();
    const navigate = useNavigate();
    const { mutate: signOut } = useSignOut({
      onSuccess: () => {
        navigate({ to: SignInRoute.to, search: { redirect: '/account' } });
      },
    });
    const { mutate: restoreAccount } = useRestoreAccount({
      onError: () => {
        toast.error('Failed to restore account');
      },
    });

    if (myAccount?.deletingAt) {
      return (
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <AccountDeactivatedCard
            deletingAt={new Date(myAccount.deletingAt).toLocaleDateString(
              undefined,
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )}
            onReactivate={() => restoreAccount()}
          />
        </div>
      );
    }
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
