import { cn } from '@/lib/utils';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface FileUploadProps {
  disabled?: boolean | undefined;
  multiple?: boolean | undefined;
  validateDrop?: (files: File[]) => [File[], FileRejection[]];
  onAcceptFile?: (file: File) => void;
  onRejectFile?: (rejection: FileRejection) => void;
}

export function FileUpload({
  disabled,
  multiple,
  validateDrop,
  onAcceptFile,
  onRejectFile,
  className,
  children,
}: FileUploadProps & React.ComponentProps<'div'>) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled,
    multiple,
    onDrop(files) {
      if (validateDrop) {
        const [valid, rejected] = validateDrop(files);
        for (const f of valid) {
          onAcceptFile?.(f);
        }
        for (const r of rejected) {
          onRejectFile?.(r);
        }
      } else {
        for (const f of files) {
          onAcceptFile?.(f);
        }
      }
    },
  });
  return (
    <div
      {...getRootProps()}
      data-disabled={disabled ? '' : undefined}
      data-dragging={isDragActive ? '' : undefined}
      className={cn(
        'hover:bg-accent/30 focus-visible:border-ring/50 data-[dragging]:border-primary/30 data-[invalid]:border-destructive data-[dragging]:bg-accent/30 data-[invalid]:ring-destructive/20 relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors outline-none select-none data-[disabled]:pointer-events-none',
        className,
      )}
    >
      <input
        {...getInputProps()}
        type="file"
        tabIndex={-1}
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
      />
      {children}
    </div>
  );
}
