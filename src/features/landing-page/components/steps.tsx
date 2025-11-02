export function Steps() {
  return (
    <div className="bg-secondary/10 px-20 py-8">
      <h2 className="mb-6 text-center text-4xl font-semibold text-pretty lg:text-5xl">
        How it works
      </h2>
      <div className="max-w-8xl grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="my-6 flex max-w-xs flex-col items-start gap-1.5">
      <div className="leading-none font-semibold">{title}</div>
      <div className="text-muted-foreground text-sm">{description}</div>
    </div>
  );
}
