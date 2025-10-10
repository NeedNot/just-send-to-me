import { getFileUrl } from '../api/download-file';
import { downloadFile } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';
import { useCooldown } from '@/hooks/use-cooldown';

export function FileDownloadButton({
  name,
  objectKey,
}: {
  name: string;
  objectKey: string;
}) {
  const { cooldown, startCooldown } = useCooldown(2000);

  const handleDownload = () => {
    downloadFile(name, getFileUrl(objectKey));
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
