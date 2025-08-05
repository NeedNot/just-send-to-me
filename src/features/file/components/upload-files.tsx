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
import { type Folder } from '@shared/schemas';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function UploadFiles({ folder }: { folder: Folder }) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const { uploadFile, abortUpload, fileStatuses } = useFileUploader(
    async (file, signal) => {
      const response = await requestPresignedUrl(
        {
          name: file.name!,
          size: file.size!,
          folderId: folder.id,
        },
        signal,
      );
      return response.signedUrl;
    },
  );

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
          .catch((reason: Error | string) => {
            if (typeof reason === 'string') {
              toast.error(reason, {
                description: file.name,
              });
              onError(file, new Error(reason));
            } else {
              toast.error(`Unable to upload`, {
                description: file.name,
              });
              onError(file, reason);
            }
            throw reason;
          })
          .then((msg) => {
            toast.success(msg, { description: file.name });
            queryClient.setQueryData(['folder', folder.id], (prev: Folder) => ({
              ...prev,
              size: prev.size + file.size,
            }));
            // todo this is problematic because it thinks there is never an error
            onSuccess(file);
          });
      }
    },
    [folder.id, queryClient, uploadFile],
  );

  return (
    <FileUpload
      multiple
      className="w-full"
      value={files}
      onFileValidate={(newFile) =>
        files.some(
          (file) =>
            file.name === newFile.name &&
            file.size === newFile.size &&
            file.lastModified === newFile.lastModified,
        )
          ? 'File already exists'
          : null
      }
      onFileReject={(file, message) =>
        toast.error(message, { description: file.name })
      }
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
              {fileStatuses.find((f) => f.file === file)?.status !==
                'complete' && (
                <FileUploadItemDelete onClick={() => abortUpload(file)} asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <X />
                  </Button>
                </FileUploadItemDelete>
              )}
            </div>
            <FileUploadItemProgress />
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}
