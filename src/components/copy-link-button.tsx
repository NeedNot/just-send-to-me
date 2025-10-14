import { Button, buttonVariants } from './ui/button';
import { Link } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { useCooldown } from '@/hooks/use-cooldown';

export type CopyLinkButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  } & {
    link: string;
  };

export default function CopyLinkButton({
  link,
  ...props
}: CopyLinkButtonProps) {
  const { timeLeft, startCooldown } = useCooldown(2000);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    startCooldown();
  };

  return (
    <Button
      size="sm"
      variant={timeLeft > 0 ? 'secondary' : 'default'}
      onClick={handleCopy}
      {...props}
      className={'transition-colors duration-200' + ' ' + props.className}
    >
      {timeLeft > 0 ? 'Copied!' : <Link />}
    </Button>
  );
}
