import type { File } from '@shared/schemas';
import { getFileUrl } from '../api/download-file';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

function handleDownload(file: File) {
  const fileUrl = getFileUrl(file.key);
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  return (
    <Button
      variant="ghost"
      onClick={() => handleDownload(file)}
      size="icon"
      className="size-7"
    >
      <Download />
    </Button>
  );
}
