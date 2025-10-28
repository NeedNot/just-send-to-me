import { Hero7 } from '@/components/hero7';

export function Hero() {
  return (
    <Hero7
      heading="Easily receive files from anyone"
      description="Temporary folders anyone with a link can upload to"
      button={{
        text: 'Create a folder for free',
        url: '/new',
      }}
    />
  );
}
