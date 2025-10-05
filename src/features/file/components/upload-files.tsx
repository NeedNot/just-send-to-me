import React, { useMemo } from 'react';
import {
  requestPresignedUrl,
  useFileUploader,
  type FileStatus,
} from '../api/upload-file';
import { type Folder } from '@shared/schemas';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { FileUpload } from '@/components/ui/better-file-upload';
import { type FileRejection, ErrorCode } from 'react-dropzone';

export interface UploadFilesProps {
  folder: Folder;
  createFilesListComponent?: (incompleteFiles: FileStatus[]) => React.Component;
}

export function UploadFiles({
  folder,
  createFilesListComponent,
}: UploadFilesProps) {
  const queryClient = useQueryClient();

  const { uploadFile, abortUpload, fileStatuses } = useFileUploader(
    async (file, signal) => {
      try {
        const response = await requestPresignedUrl(
          {
            name: file.name!,
            size: file.size!,
            folderId: folder.id,
          },
          signal,
        );
        return response.signedUrl;
      } catch (e: any) {
        if (e.cause === 413) {
          throw Error('File is too large');
        }
        throw e;
      }
    },
  );

  const incompleteFiles = useMemo(
    () => fileStatuses.filter((f) => f.status !== 'complete'),
    [fileStatuses],
  );

  const validate = (files: File[]): [File[], FileRejection[]] => {
    const valid: File[] = [];
    const rejected: FileRejection[] = [];

    let remainingSpace =
      folder.maxSize -
      (fileStatuses.reduce(
        (v, s) =>
          ['getting-url', 'uploading'].includes(s.status) ? v + s.file.size : v,
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

  const onAcceptFile = async (file: File) => {
    console.log('Uploading file', file.name);
    // todo even need to have errors here? state is inside of the hook anyway
    try {
      await uploadFile(file);
      queryClient.setQueryData(['folder', folder.id], (prev: Folder) => ({
        ...prev,
        size: prev.size + file.size,
        fileCount: prev.fileCount + 1,
        files: [
          ...(prev.files ?? []),
          {
            id: 'todo',
            name: file.name,
            key: 'todo',
            folderId: folder.id,
            size: file.size,
          },
        ],
      }));
    } catch (e: any) {
      console.log('got error', e);
    }
  };

  const onRejectFile = (rejection: FileRejection) => {
    toast.error(`Unable to upload ${rejection.file.name}`, {
      description: rejection.errors[0].message,
    });
  };

  return (
    <>
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
            Or click to browse (max 100 files, up to{' '}
            {formatBytes(folder.maxSize)} total)
          </p>
        </div>
      </FileUpload>
      {createFilesListComponent && createFilesListComponent(incompleteFiles)}
    </>
  );
}
