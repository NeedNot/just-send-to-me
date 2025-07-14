import { Card } from '@/components/ui/card';
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type { File, Folder } from '../../../api/types';
import * as Buffer from 'buffer';
import { Countdown } from '../../../components/countdown';
import CopyLinkButton from '../../../components/copy-link-button';
import { Button } from '../../../components/ui/button';
import { Download, Upload, X } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { useMemo, useState } from 'react';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from '../../../components/ui/file-upload';
import { formatBytes } from '../../../lib/utils';

export function FolderCard({ folder }: { folder: Folder }) {
  const folderSize = useMemo(() => {
    if (!folder?.files) return 0;
    return folder?.files.reduce((acc, file) => acc + file.size, 0);
  }, [folder?.files]);

  if (!folder) return <div>No folder</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{folder.name}</CardTitle>
        <CardDescription>
          <Countdown prefix="Expires in" targetDate={folder.expiresAt} />
        </CardDescription>
        <CardAction className="flex gap-2">
          <CopyLinkButton variant={'outline'} link="todo here" />
          <Button size="sm" variant={'default'}>
            <Download />
            Download all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* empty folder */}
        {folder.files.length == 0 && folder.isOwnFolder && EmptyList()}
        {!folder.isOwnFolder && <UploadDialog />}

        {folder.files.length > 0 && <FilesList files={folder.files} />}
      </CardContent>
      {(!folder.isOwnFolder || folder.files.length > 0) && (
        <CardFooter className="flex gap-4">
          <Progress value={(folderSize / folder.maxSize) * 100} />
          <div className="shrink-0">
            {formatBytes(folderSize)} / {formatBytes(folder.maxSize)}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

function EmptyList() {
  return (
    <div className="flex h-20 w-full flex-col items-center justify-center">
      <p className="font-medium">No files uploaded yet</p>
      <p className="text-muted-foreground">
        Share this folder with someone so they can upload files
      </p>
    </div>
  );
}

function UploadDialog() {
  const [files, setFiles] = useState<Buffer.File[]>([]);

  return (
    <FileUpload
      multiple
      className="w-full"
      value={files}
      onValueChange={setFiles}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="text-muted-foreground size-6" />
          </div>
          <p className="text-sm font-medium">Drag & drop files here</p>
          <p className="text-muted-foreground text-xs">
            Or click to browse (max 2 files, up to 5MB each)
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
          <FileUploadItem key={index} value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X />
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
}

function FilesList({ files }: { files: File[] }) {
  return (
    <ul className="pt-2">
      {files.map((file) => (
        <li
          className="flex w-full items-center rounded-md border p-3 not-last:mb-2"
          key={file.id}
        >
          <img
            className="mr-2 size-10 rounded object-cover"
            src="https://images.unsplash.com/photo-1682685796063-d2604827f7b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8"
            alt=""
          />
          <div className="flex flex-1 flex-col">
            <span className="truncate text-sm font-medium">{file.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {formatBytes(file.size)}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="size-7">
            <Download />
          </Button>
        </li>
      ))}
    </ul>
  );
}