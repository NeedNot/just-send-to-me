import type { File } from '@shared/schemas';
import { getFileUrl } from '../api/download-file';
import { downloadFile, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';
import { useCooldown } from '@/hooks/use-cooldown';

export function FileList({ files }: { files: File[] }) {
  return (
    <ul className="pt-2">
      {files.map((file) => (
        <li
          className="flex w-full items-center rounded-md border p-3 not-last:mb-2"
          key={file.id}
        >
          {file.thumbnail && (
            <img
              className="mr-2 size-10 rounded object-cover"
              src={file.thumbnail}
              alt=""
            />
          )}
          <div className="flex flex-1 flex-col">
            <span className="truncate text-sm font-medium">{file.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {formatBytes(file.size)}
            </span>
          </div>
          <FileDownloadButton file={file} />
        </li>
      ))}
    </ul>
  );
}

export function FileDownloadButton({ file }: { file: File }) {
  const { cooldown, startCooldown } = useCooldown(2000);

  const handleDownload = () => {
    downloadFile(file.name, getFileUrl(file.key));
    startCooldown();
  };

  return (
    <Button
      variant="ghost"
      onClick={() => handleDownload()}
      size="icon"
      className="size-7"
    >
      {cooldown ? <Check /> : <Download />}
    </Button>
  );
}
