import { Card } from '@/components/ui/card';
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type { File, Folder } from '../../../api/types';
import { Countdown } from '../../../components/countdown';
import CopyLinkButton from '../../../components/copy-link-button';
import { Button } from '../../../components/ui/button';
import { Download } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';

export function FolderCard({ folder }: { folder: Folder }) {
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
          <Button size="sm" variant={'default'}>
            <Download />
            Download all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FilesList files={folder.files} />
      </CardContent>
      <CardFooter>
        <Progress
          value={
            (folder.files.reduce((acc, file) => acc + file.size, 0) /
              folder.maxSize) *
            100
          }
        />
      </CardFooter>
    </Card>
  );
}

function FilesList({ files }: { files: File[] }) {
  if (files.length === 0)
    return (
      <div className="flex h-20 w-full flex-col items-center justify-center">
        <p className="font-medium">No files uploaded yet</p>
        <p className="text-muted-foreground">
          Share this folder with someone so they can upload files
        </p>
      </div>
    );
  return (
    <ul>
      {files.map((file) => (
        <li
          className="flex w-full rounded-md p-4 outline not-last:mb-4"
          key={file.id}
        >
          <img
            className="mr-2 h-12 w-12 rounded-md object-cover"
            src="https://images.unsplash.com/photo-1682685796063-d2604827f7b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8"
            alt=""
          />
          <span className="flex flex-col">
            <div className="font-medium">{file.name}</div>
            <div className="text-muted-foreground">
              {formatBytes(file.size)}
            </div>
          </span>
          <Button className="ml-auto" size={'icon'} variant={'secondary'}>
            <Download />
          </Button>
        </li>
      ))}
    </ul>
  );
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let index = 0;
  while (bytes >= 1024) {
    bytes /= 1024;
    index++;
  }

  return `${bytes.toFixed(2)} ${units[index]}`;
};
