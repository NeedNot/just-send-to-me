import { Button } from '@/components/ui/button';
import { useSignUp } from '@/features/auth/api/sign-up';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: RouteComponent,
});

function RouteComponent() {
  const signUp = useSignUp();

  const handleClick = async () => {
    signUp.mutate({ email: 'john@gmail.com', password: 'abc1223333' });
  };

  return (
    <div>
      <Button onClick={handleClick}>Sign up</Button>
    </div>
  );
}
