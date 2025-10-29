import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function Steps() {
  return (
    <div className="bg-secondary/10 p-8">
      <h2 className="mb-6 text-center text-4xl font-semibold text-pretty lg:text-5xl">
        How it works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Step
          title="Step 1"
          description="Create a request folder. Choose how long the folder will be active."
        />
        <Step
          title="Step 2"
          description="Share the folder link or qr code with others."
        />
        <Step
          title="Step 3"
          description="Other people upload files without needing to create an account."
        />
        <Step title="Step 4" description="Download the files." />
      </div>
    </div>
  );
}

interface StepProps {
  title: string;
  description: string;
}

function Step({ title, description }: StepProps) {
  return (
    <Card className="bg-trasnparent w-sm border-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
