import { Card } from '@/components/ui/card';
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Check, Download, Share, X } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { downloadFile, formatBytes } from '../../../lib/utils';
import type { File, Folder } from '@shared/schemas';
import { FileUploader } from '@/features/file/components/file-uploader';
import { useDownloadFolder } from '../api/download-all-files';
import { authClient } from '@/lib/better-auth';
import TimeAgo, { type Unit } from 'react-timeago';
import {
  useFileUploader,
  type FileStatus,
} from '@/features/file/api/upload-file';
import { useEffect, useMemo, useRef, type MouseEventHandler } from 'react';
import { useCooldown } from '@/hooks/use-cooldown';
import { toast } from 'sonner';
import { ShareDialog } from '@/components/share-dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export function FolderCard({
  folder,
  ...props
}: { folder: Folder } & React.ComponentProps<typeof Card>) {
  const expiresAt = new Date(folder.expiresAt);
  const { progress, downloading, downloadFolder } = useDownloadFolder();
  const { upload, statuses, abort } = useFileUploader(folder.id);
  const { data: session } = authClient.useSession();
  const prevInprogressRef = useRef(new Set());
  const shareUrl = window.location.origin + window.location.pathname;

  useEffect(() => {
    const prevInprogress = prevInprogressRef.current;
    const inprogress = new Set<string>();

    for (const { id, name, status, error } of statuses) {
      const wasPrev = prevInprogress.has(id);
      if (wasPrev && status === 'complete') {
        toast.success(name, { description: 'Successfully uploaded' });
      } else if (wasPrev && status === 'failed') {
        toast.error(name, { description: error || 'Failed to upload' });
      } else if (status === 'preparing' || status === 'uploading') {
        inprogress.add(id);
      }
    }

    prevInprogressRef.current = inprogress;
  }, [statuses]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        statuses.some(
          (s) => s.status === 'preparing' || s.status === 'uploading',
        )
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [statuses, abort]);

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
          <ShareDialog url={shareUrl}>
            <Button size="sm" variant="outline">
              <Share />
            </Button>
          </ShareDialog>
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
        <FileUploader folder={folder} upload={upload} statuses={statuses} />
        {(folder.files ?? []).length == 0 && isOwner && <EmptyFolder />}
        {!!fileList.length && (
          <ul className="mt-2 max-h-96 overflow-scroll">
            {fileList.map((f) => (
              <FileListItem key={f.id} file={f} onAbort={() => abort(f.id)} />
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

function EmptyFolder() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Folder is empty</EmptyTitle>
        <EmptyDescription>
          Share the folder with others so they can upload files
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ShareDialog url={window.location.origin + window.location.pathname}>
          <Button size="sm" variant="outline">
            <Share />
            Share
          </Button>
        </ShareDialog>
      </EmptyContent>
    </Empty>
  );
}

function FileListItem({
  file,
  onAbort,
}: {
  file: File | FileStatus;
  onAbort?: MouseEventHandler<HTMLButtonElement>;
}) {
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
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="max-w-full truncate text-sm font-medium">
          {file.name}
        </span>
        {'error' in file ? (
          <span className="text-xs text-red-500">{file.error}</span>
        ) : (
          <span className="text-muted-foreground truncate text-xs">
            {formatBytes(file.size)}
          </span>
        )}

        {'progress' in file && !file.error && file.status !== 'complete' && (
          <span className="pt-2">
            <Progress value={file.progress} />
          </span>
        )}
      </div>
      {/* buttons */}
      {'status' in file &&
        (file.status === 'uploading' || file.status === 'preparing') && (
          <AbortFileUploadButton onClick={onAbort} />
        )}
      {'key' in file && (
        <FileDownloadButton name={file.name} objectKey={file.key} />
      )}
    </li>
  );
}

function FileDownloadButton({
  name,
  objectKey,
}: {
  name: string;
  objectKey: string;
}) {
  const { timeLeft, startCooldown } = useCooldown(2000);

  const handleDownload = () => {
    downloadFile(name, `${import.meta.env.VITE_R2_URL}/${objectKey}`);
    startCooldown();
  };

  return (
    <Button
      variant="ghost"
      onClick={() => handleDownload()}
      size="icon"
      className="size-7"
    >
      {timeLeft > 0 ? <Check /> : <Download />}
    </Button>
  );
}

function AbortFileUploadButton({
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" {...props} size="icon" className="size-7">
      <X />
    </Button>
  );
}
