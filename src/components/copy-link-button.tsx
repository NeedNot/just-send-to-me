import { useState } from 'react';
import { Button, buttonVariants } from './ui/button';
import { Link } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant={copied ? 'secondary' : 'default'}
      onClick={handleCopy}
      {...props}
      className={'transition-colors duration-200' + ' ' + props.className}
    >
      {copied ? 'Copied!' : <Link />}
    </Button>
  );
}
