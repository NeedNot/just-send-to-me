import { Button } from '@/components/ui/button';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
} from '@/components/ui/file-upload';
import { formatBytes } from '@/lib/utils';
import { Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { requestPresignedUrl, useFileUploader } from '../api/upload-file';
import type { Folder } from '@shared/schemas';
import { toast } from 'sonner';

export function UploadFiles({ folder }: { folder: Folder }) {
  const [files, setFiles] = useState<File[]>([]);
  const { uploadFile, abortUpload } = useFileUploader(async (file) => {
    const response = await requestPresignedUrl({
      name: file.name!,
      size: file.size!,
      folderId: folder.id,
    });
    return response.signedUrl;
  });

  const onUpload = useCallback(
    (
      files: File[],
      {
        onProgress,
        onError,
        onSuccess,
      }: {
        onProgress: (file: File, progress: number) => void;
        onError: (file: File, error: Error) => void;
        onSuccess: (file: File) => void;
      },
    ) => {
      for (const file of files) {
        uploadFile(file, (number) => onProgress(file, number))
          .catch((reason: Error) => {
            toast.error(`Unable to upload ${file.name}`, {
              description: reason.message,
            });
            onError(file, reason);
          })
          .then(() => onSuccess(file));
      }
    },
    [],
  );
  // todo dont allow duplicates

  return (
    <FileUpload
      multiple
      className="w-full"
      value={files}
      onValueChange={setFiles}
      // onFileValidate={(file) => (file.size < maxSize ? null : 'File too large')} //todo account for total folder size
      onUpload={onUpload}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="text-muted-foreground size-6" />
          </div>
          <p className="text-sm font-medium">Drag & drop files here</p>
          <p className="text-muted-foreground text-xs">
            Or click to browse (max 100 files, up to{' '}
            {formatBytes(folder.maxSize)} total)
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2 w-fit">
            Browse files
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>
      <FileUploadList>
        {files.map((file, index) => (
          <FileUploadItem className="flex flex-col" key={index} value={file}>
            <div className="flex w-full gap-2">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete onClick={() => abortUpload(file)} asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <X />
                </Button>
              </FileUploadItemDelete>
            </div>
            <FileUploadItemProgress />
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}
