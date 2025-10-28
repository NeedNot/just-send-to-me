import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface Hero7Props {
  heading: string;
  description: string;
  button: {
    text: string;
    url: string;
  };
}

const Hero7 = ({ heading, description, button }: Hero7Props) => {
  return (
    <section className="py-32">
      <div className="container text-center">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <h1 className="text-3xl font-semibold lg:text-6xl">{heading}</h1>
          <p className="text-muted-foreground text-balance lg:text-lg">
            {description}
          </p>
        </div>
        <Button asChild size="lg" className="mt-10">
          <Link to={button.url}>{button.text}</Link>
        </Button>
      </div>
    </section>
  );
};

export { Hero7 };
