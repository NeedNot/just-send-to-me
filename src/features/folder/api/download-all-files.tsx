import type { Folder, File } from '@shared/schemas';
import { getFileUrl } from '@/features/file/api/download-file';
import JSZip from 'jszip';
import { useState } from 'react';
import { downloadFile } from '@/lib/utils';

export function useDownloadFolder() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadFolder = async ({ name, files }: Folder) => {
    try {
      setDownloading(true);
      if (!files) return;

      const zip = await downloadAndZipFiles(files, (progress) => {
        return setProgress(progress);
      });
      if (!zip) return;

      downloadFile(`${name}.zip`, URL.createObjectURL(zip));
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return { progress, downloadFolder, downloading };
}

async function downloadAndZipFiles(
  files: File[],
  onProgress?: (progress: number) => void,
) {
  const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
  let bytesDownloaded = 0;

  const zip = new JSZip();

  const filePromises = files.map(async (file) => {
    const { key, name } = file;

    const fileContent = await new Promise<Blob>((resolve) => {
      let bytesTransferred = 0;
      const request = new XMLHttpRequest();
      request.open('GET', getFileUrl(key));

      request.onprogress = (event) => {
        bytesDownloaded += event.loaded - bytesTransferred;
        bytesTransferred = event.loaded;
        if (onProgress)
          onProgress(Math.min((bytesDownloaded / totalBytes) * 100, 100));
      };

      request.onload = () => {
        resolve(request.response);
        if (onProgress) onProgress((bytesDownloaded / totalBytes) * 100);
      };

      request.responseType = 'blob';
      request.send();
    });

    return { name, fileContent };
  });
  const resolvedFiles = await Promise.all(filePromises);

  resolvedFiles.forEach(({ name, fileContent }) => {
    zip.file(name, fileContent);
  });

  return zip.generateAsync({ type: 'blob' });
}
