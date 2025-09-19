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
import { useCountdown } from '@/hooks/use-countddown';

export function FolderCard({ folder }: { folder: Folder }) {
  const { display: expiration, isDone: isExpired } = useCountdown(
    new Date(folder.expiresAt),
  );
  const { progress, downloading, downloadFolder } = useDownloadFolder();
  const ownerOfFolder = folder?.creatorId !== '123';

  const handleDownload = async () => {
    if (downloading) return;
    downloadFolder(folder);
  };

  if (isExpired) {
    return <div>This card is expired</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{folder.name}</CardTitle>
        <CardDescription>
          {/* todo tooltip */}
          <span>{isExpired ? 'Expired' : `Expires in ${expiration}`}</span>
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
        {(folder.files ?? []).length == 0 && ownerOfFolder && EmptyList()}
        {!ownerOfFolder && <UploadFiles folder={folder} />}

        {(folder.files ?? []).length > 0 && (
          <FileList files={folder.files || []} />
        )}
      </CardContent>
      {(!ownerOfFolder || (folder.files ?? []).length > 0) && (
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
