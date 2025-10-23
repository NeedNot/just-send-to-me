import { Footer } from '@/components/footer';
import { NavbarSignedIn } from '@/components/navbar-signed-in';
import { Navbar1 } from '@/components/navbar1';
import { useMyAccount } from '@/features/account/api/my-account';
import { authClient } from '@/lib/better-auth';
import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => {
    return (
      <>
        {/* <SignUpPrompterProvider> */}
        <HeadContent />
        <div className="bg-background flex min-h-screen flex-col gap-4">
          <Navbar />
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

function Navbar() {
  // todo better way to detect if signed in
  const { data: myAccount, isPending } = useMyAccount();
  const session = authClient.useSession();
  const menu = [
    { title: 'Home', url: '/' },
    { title: 'Features', url: '/features' },
    { title: 'Pricing', url: '/pricing' },
    { title: 'About', url: '/about' },
  ];
  return session.data ? (
    <NavbarSignedIn
      user={
        myAccount && {
          ...myAccount,
          credits: myAccount?.remainingCredits,
          maxCredits: myAccount?.plan.credits,
        }
      }
      isLoading={isPending}
      menu={menu}
    />
  ) : (
    <Navbar1
      auth={{
        login: { url: '/sign-in', title: 'Sign In' },
        signup: { url: '/sign-up', title: 'Sign Up' },
      }}
      menu={menu}
    />
  );
}
