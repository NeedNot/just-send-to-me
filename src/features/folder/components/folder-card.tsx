import { Card } from '@/components/ui/card';
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import CopyLinkButton from '../../../components/copy-link-button';
import { Button } from '../../../components/ui/button';
import { Download } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { formatBytes } from '../../../lib/utils';
import type { File, Folder } from '@shared/schemas';
import { FileUploader } from '@/features/file/components/file-uploader';
import { FileDownloadButton } from '@/features/file/components/file-list';
import { useDownloadFolder } from '../api/download-all-files';
import { authClient } from '@/lib/better-auth';
import { useMemo } from 'react';
import TimeAgo, { type Unit } from 'react-timeago';
import {
  useFileUploader,
  type FileStatus,
} from '@/features/file/api/upload-file';

export function FolderCard({
  folder,
  ...props
}: { folder: Folder } & React.ComponentProps<typeof Card>) {
  const expiresAt = new Date(folder.expiresAt);
  const { progress, downloading, downloadFolder } = useDownloadFolder();
  const { upload, statuses } = useFileUploader(folder.id);
  const { data: session } = authClient.useSession();

  const isOwner = useMemo(
    () => session?.user.id === folder.creatorId,
    [session],
  );

  const fileList = useMemo(
    () => [
      ...statuses.filter((s) => s.status !== 'complete'),
      ...(folder.files ?? []),
    ],
    [statuses, folder.files],
  );

  const handleDownload = async () => {
    if (downloading) return;
    downloadFolder(folder);
  };

  if (expiresAt < new Date()) {
    return <div>This card is expired</div>;
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{folder.name}</CardTitle>
        <CardDescription>
          {/* todo tooltip */}
          {expiresAt < new Date() ? (
            <span title={expiresAt.toLocaleString()}>Expired</span>
          ) : (
            <TimeAgo
              date={expiresAt}
              title={expiresAt.toLocaleString()}
              formatter={(value: number, unit: Unit) =>
                `Expires in ${value} ${unit}${value === 1 ? '' : 's'}`
              }
            />
          )}
        </CardDescription>
        <CardAction className="flex gap-2">
          <CopyLinkButton variant={'outline'} link="todo here" />
          <Button
            size="sm"
            disabled={!folder.files || downloading}
            onClick={handleDownload}
            variant={downloading ? 'outline' : 'default'}
          >
            {downloading ? (
              <>
                <Progress className="w-24" value={progress} />
              </>
            ) : (
              <>
                <Download /> Download all
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* empty folder */}
        {(folder.files ?? []).length == 0 && isOwner && EmptyList()}
        {!isOwner && (
          <FileUploader folder={folder} upload={upload} statuses={statuses} />
        )}

        {!!fileList.length && (
          <ul className="mt-2 max-h-96 overflow-scroll">
            {fileList.map((f) => (
              <FileListItem key={f.id} file={f} />
            ))}
          </ul>
        )}
      </CardContent>
      {(!isOwner || (folder.files ?? []).length > 0) && (
        <CardFooter className="flex gap-4">
          <Progress value={(folder.size / folder.maxSize) * 100} />
          <div className="shrink-0">
            {formatBytes(folder.size)} / {formatBytes(folder.maxSize)}
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

function FileListItem({ file }: { file: File | FileStatus }) {
  return (
    <li
      className="flex w-full items-center rounded-md border p-3 not-last:mb-2"
      key={file.id}
    >
      {'thumbnail' in file && (
        <img
          className="mr-2 size-10 rounded object-cover"
          src={file.thumbnail}
          alt=""
        />
      )}
      <div className="flex flex-1 flex-col">
        <span className="truncate text-sm font-medium">{file.name}</span>
        {'error' in file ? (
          <span className="text-xs text-red-500">{file.error}</span>
        ) : (
          <span className="text-muted-foreground truncate text-xs">
            {formatBytes(file.size)}
          </span>
        )}

        {'progress' in file && !file.error && (
          <span className="pt-2">
            <Progress value={file.progress} />
          </span>
        )}
      </div>
      {/* buttons */}
      {'key' in file && (
        <FileDownloadButton name={file.name} objectKey={file.key} />
      )}
    </li>
  );
}
