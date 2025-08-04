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
import { formatBytes } from '../../../lib/utils';
import type { Folder } from '@shared/schemas';
import { UploadFiles } from '@/features/file/components/upload-files';
import { FileList } from '@/features/file/components/file-list';

export function FolderCard({ folder }: { folder: Folder }) {
  const ownerOfFolder = folder?.creatorId !== '123';

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
