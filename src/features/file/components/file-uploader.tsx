import { type FileStatus } from '../api/upload-file';
import { type Folder } from '@shared/schemas';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { FileUpload } from '@/components/ui/better-file-upload';
import { type FileRejection, ErrorCode } from 'react-dropzone';
import { Link } from '@tanstack/react-router';
import { useMyAccount } from '@/features/account/api/my-account';

export interface FileUploaderProps {
  folder: Folder;
  statuses: FileStatus[];
  upload: (file: File) => Promise<void>;
}

export function FileUploader({ folder, statuses, upload }: FileUploaderProps) {
  const { data: account } = useMyAccount();
  const validate = (files: File[]): [File[], FileRejection[]] => {
    const valid: File[] = [];
    const rejected: FileRejection[] = [];

    const pendingUploads = statuses.filter(
      (f) => f.status === 'preparing' || f.status === 'uploading',
    ).length;
    if ((folder.files?.length ?? 0) + pendingUploads >= folder.maxFiles) {
      rejected.push({
        file: files[0],
        errors: [
          {
            message: 'Folder is full',
            code: ErrorCode.TooManyFiles,
          },
        ],
      });
      return [valid, rejected];
    }

    let remainingSpace =
      folder.maxSize -
      (statuses.reduce(
        (v, s) =>
          s.status === 'preparing' || s.status === 'uploading' ? v + s.size : v,
        0,
      ) +
        folder.size);
    // sorted largest to smallest so that big files have priority on being uploaded.
    for (const file of files.sort((a, b) => b.size - a.size)) {
      if (remainingSpace >= file.size) {
        valid.push(file);
        remainingSpace -= file.size;
      } else {
        rejected.push({
          file,
          errors: [
            { message: 'File is too large', code: ErrorCode.FileTooLarge },
          ],
        });
      }
    }

    return [valid, rejected];
  };

  const onAcceptFile = (file: File) => upload(file);

  const onRejectFile = (rejection: FileRejection) => {
    toast.error(`Unable to upload ${rejection.file.name}`, {
      description: rejection.errors[0].message,
    });
  };

  return (
    <>
      {!account && (
        <p className="text-muted-foreground mb-4 text-xs">
          By uploading files you consent to JustSendToMe's{' '}
          <Link className="underline" to="/legal">
            {' '}
            Terms of Service and Privacy Policy{' '}
          </Link>
        </p>
      )}
      <FileUpload
        multiple={true}
        validateDrop={validate}
        onRejectFile={onRejectFile}
        onAcceptFile={onAcceptFile}
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="text-muted-foreground size-6" />
          </div>
          <p className="text-sm font-medium">Drag & drop files here</p>
          <p className="text-muted-foreground text-xs">
            Or click to browse (max {folder.maxFiles} files, up to{' '}
            {formatBytes(folder.maxSize)} total)
          </p>
        </div>
      </FileUpload>
    </>
  );
}
