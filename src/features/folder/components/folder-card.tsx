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
import type { Folder } from '@shared/schemas';
import { UploadFiles } from '@/features/file/components/upload-files';
import { FileList } from '@/features/file/components/file-list';
import { useDownloadFolder } from '../api/download-all-files';
import { authClient } from '@/lib/better-auth';
import { useEffect, useMemo } from 'react';
import TimeAgo, { type Unit } from 'react-timeago';

export function FolderCard({ folder }: { folder: Folder }) {
  const expiresAt = new Date(folder.expiresAt);
  const { progress, downloading, downloadFolder } = useDownloadFolder();
  const { data: session } = authClient.useSession();

  const isOwner = useMemo(
    () => session?.user.id === folder.creatorId,
    [session],
  );

  const handleDownload = async () => {
    if (downloading) return;
    downloadFolder(folder);
  };

  if (expiresAt < new Date()) {
    return <div>This card is expired</div>;
  }

  return (
    <Card>
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
        {!isOwner && <UploadFiles folder={folder} />}

        {(folder.files ?? []).length > 0 && (
          <FileList files={folder.files || []} />
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
