import { Card } from '@/components/ui/card';
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Countdown } from '../../../components/countdown';
import CopyLinkButton from '../../../components/copy-link-button';
import { Button } from '../../../components/ui/button';
import { Download } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { useMemo } from 'react';
import { formatBytes } from '../../../lib/utils';
import type { Folder, File as FileEntity } from '@shared/schemas';
import { UploadFiles } from '@/features/file/components/upload-files';

export function FolderCard({ folder }: { folder: Folder }) {
  const ownerOfFolder = folder?.creatorId !== '123';
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
          <Button size="sm" disabled={!folder.files} variant={'default'}>
            <Download />
            Download all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* empty folder */}
        {(folder.files ?? []).length == 0 && ownerOfFolder && EmptyList()}
        {!ownerOfFolder && <UploadFiles folder={folder} />}

        {(folder.files ?? []).length > 0 && (
          <FilesList files={folder.files || []} />
        )}
      </CardContent>
      {(!ownerOfFolder || (folder.files ?? []).length > 0) && (
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

function FilesList({ files }: { files: FileEntity[] }) {
  return (
    <ul className="pt-2">
      {files.map((file) => (
        <li
          className="flex w-full items-center rounded-md border p-3 not-last:mb-2"
          key={file.id}
        >
          {file.thumbnail && (
            <img
              className="mr-2 size-10 rounded object-cover"
              src={file.thumbnail}
              alt=""
            />
          )}
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
