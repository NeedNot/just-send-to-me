import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Folder } from '@shared/schemas';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatBytes } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import TimeAgo from 'react-timeago';

export function MyExpiredFoldersCard({
  folders,
  ...props
}: { folders: Folder[] } & React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Expired folders</CardTitle>
        <CardDescription>
          Folder content can no longer be accessed or downloaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        {folders && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Name</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Space used</TableHead>
                  <TableHead className="text-right">Expired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders?.map((f) => (
                  <FolderRow key={f.id} folder={f} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FolderRow({
  folder,
  ...props
}: {
  folder: Folder;
} & React.ComponentProps<typeof TableRow>) {
  const expiresAt = new Date(folder.expiresAt);
  return (
    <TableRow {...props}>
      <TableCell className="max-w-48 overflow-hidden text-ellipsis">
        <Tooltip delayDuration={1000} disableHoverableContent>
          <TooltipTrigger>{folder.name}</TooltipTrigger>
          <TooltipContent>{folder.name}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>{folder.fileCount}</TableCell>
      <TableCell>{formatBytes(folder.size)}</TableCell>
      <TableCell className="text-right">
        <Badge variant="outline">
          <TimeAgo
            title={expiresAt.toLocaleString()}
            date={expiresAt}
          ></TimeAgo>
        </Badge>
      </TableCell>
    </TableRow>
  );
}
