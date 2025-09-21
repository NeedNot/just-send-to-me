import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMyFolders } from '../api/my-folders';
import type { Folder } from '@shared/schemas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBytes, formatTime } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MS_IN_DAY } from '@shared/constants';
import { useCountdown } from '@/hooks/use-countddown';

export function MyFoldersCard() {
  const { data: folders, isError } = useMyFolders();
  return (
    <Card>
      <CardHeader>
        <CardTitle>My folders</CardTitle>
        <CardDescription>Something here</CardDescription>
      </CardHeader>
      <CardContent>
        {folders && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Name</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Space free</TableHead>
                <TableHead className="text-right">Expires in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folders?.map((f) => (
                <FolderRow key={f.id} folder={f} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function FolderRow({ folder }: { folder: Folder }) {
  const expiresAt = new Date(folder.expiresAt);
  const countdown = useCountdown(expiresAt);
  const daysTill = (expiresAt.getTime() - Date.now()) / MS_IN_DAY;
  return (
    <TableRow>
      <TableCell className="max-w-48 overflow-hidden text-ellipsis">
        <Tooltip delayDuration={1000} disableHoverableContent>
          <TooltipTrigger>{folder.name}</TooltipTrigger>
          <TooltipContent>{folder.name}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>{folder.fileCount}</TableCell>
      <TableCell>{formatBytes(folder.maxSize - folder.size)}</TableCell>
      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={daysTill < 1 ? 'destructive' : 'secondary'}>
              {countdown.display}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{expiresAt.toLocaleString()}</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
