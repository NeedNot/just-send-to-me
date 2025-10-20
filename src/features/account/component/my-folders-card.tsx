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
import type React from 'react';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Folder } from '@shared/schemas';
import { useCountdown } from '@/hooks/use-countddown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';

export function MyFoldersCard({
  folders,
  ...props
}: {
  folders: Folder[];
} & React.ComponentProps<typeof Card>) {
  const navigate = useNavigate();
  const onFolderClick = useCallback((id: string) => {
    navigate({ to: '/folder/$id', params: { id } });
  }, []);
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Active folders</CardTitle>
        <CardDescription>
          Once folders expire you will not be able to access the files
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
                  <TableHead>Space free</TableHead>
                  <TableHead className="text-right">Expires in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folders?.map((f) => (
                  <FolderRow
                    key={f.id}
                    onClick={() => onFolderClick(f.id)}
                    folder={f}
                  />
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
  const countdown = useCountdown(expiresAt);
  if (expiresAt.getTime() - Date.now() < 1) {
    return null;
  }
  return (
    <TableRow {...props}>
      <TableCell className="max-w-48 overflow-hidden text-ellipsis">
        <Tooltip delayDuration={1000} disableHoverableContent>
          <TooltipTrigger>{folder.name}</TooltipTrigger>
          <TooltipContent>{folder.name}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>{folder.fileCount}</TableCell>
      <TableCell>{formatBytes(folder.maxSize - folder.size)}</TableCell>
      <TableCell className="text-right">
        <Badge variant="outline">
          <time
            dateTime={expiresAt.toISOString()}
            title={expiresAt.toLocaleString()}
          >
            {countdown.display}
          </time>
        </Badge>
      </TableCell>
    </TableRow>
  );
}
