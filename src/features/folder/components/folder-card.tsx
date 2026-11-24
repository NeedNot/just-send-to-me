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
import { Check, CircleCheck, Download, Share, X } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { downloadFile, formatBytes } from '../../../lib/utils';
import type { File, FolderView } from '@shared/schemas';
import { fileDownloadUrl } from '../api/download-file';
import { FileUploader } from '@/features/file/components/file-uploader';
import { useDownloadFolder } from '../api/download-all-files';
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
}: { folder: FolderView } & React.ComponentProps<typeof Card>) {
  const expiresAt = new Date(folder.expiresAt);
  const { progress, downloading, downloadFolder } = useDownloadFolder();
  const { upload, statuses, abort } = useFileUploader(folder.id);
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

  // decided by the server from the session / uploader cookie
  const isOwner = folder.viewer === 'owner';

  const inProgress = useMemo(
    () => statuses.filter((s) => s.status !== 'complete'),
    [statuses],
  );
  // owner: every file in the folder. Uploader: only what this browser sent.
  const fileList = useMemo(
    () => [...inProgress, ...folder.files],
    [inProgress, folder.files],
  );

  const handleDownload = async () => {
    if (downloading) return;
    try {
      await downloadFolder(folder);
    } catch (e) {
      toast.error((e as Error).message || 'Download failed');
    }
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
          {isOwner && (
            <Button
              size="sm"
              disabled={folder.files.length === 0 || downloading}
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
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* empty folder */}
        <FileUploader folder={folder} upload={upload} statuses={statuses} />
        {isOwner ? (
          <>
            {fileList.length == 0 && <EmptyFolder />}
            {!!fileList.length && (
              <ul className="mt-2 max-h-96 overflow-auto">
                {fileList.map((f) => (
                  <FileListItem
                    key={f.id}
                    file={f}
                    onAbort={() => abort(f.id)}
                  />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {!!inProgress.length && (
              <ul className="mt-2 max-h-96 overflow-auto">
                {inProgress.map((f) => (
                  <FileListItem
                    key={f.id}
                    file={f}
                    onAbort={() => abort(f.id)}
                  />
                ))}
              </ul>
            )}
            {!!folder.files.length && (
              <SentFiles folderName={folder.name} files={folder.files} />
            )}
          </>
        )}
      </CardContent>
      {(!isOwner || folder.files.length > 0) && (
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

/**
 * Uploader's receipt: what this browser has sent to the folder. Comes from
 * the server (files tagged with this browser's uploader cookie), so it is
 * still there after a reload.
 */
function SentFiles({
  folderName,
  files,
}: {
  folderName: string;
  files: File[];
}) {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  return (
    <section className="mt-4" aria-labelledby="sent-files-heading">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 id="sent-files-heading" className="text-sm font-medium">
          You sent {files.length} {files.length === 1 ? 'file' : 'files'} to{' '}
          {folderName}
        </h3>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatBytes(total)}
        </span>
      </div>
      <ul className="max-h-96 overflow-auto">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex w-full items-center gap-3 rounded-md border p-3 not-last:mb-2"
          >
            <CircleCheck
              className="size-5 shrink-0 text-green-600 dark:text-green-500"
              aria-label="Received"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="max-w-full truncate text-sm font-medium">
                {f.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatBytes(f.size)}
              </span>
            </div>
            <FileDownloadButton name={f.name} fileId={f.id} />
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2 text-xs">
        Only you (on this browser) and the folder owner can see these files.
      </p>
    </section>
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
      {!('status' in file) && (
        <FileDownloadButton name={file.name} fileId={file.id} />
      )}
    </li>
  );
}

function FileDownloadButton({
  name,
  fileId,
}: {
  name: string;
  fileId: string;
}) {
  const { timeLeft, startCooldown } = useCooldown(2000);

  const handleDownload = () => {
    downloadFile(name, fileDownloadUrl(fileId));
    startCooldown();
  };

  return (
    <Button
      variant="ghost"
      onClick={() => handleDownload()}
      size="icon"
      className="size-7"
      aria-label={`Download ${name}`}
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
