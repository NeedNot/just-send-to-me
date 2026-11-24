import type { Folder, File } from '@shared/schemas';
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

  // loaded on demand so the folder page doesn't ship jszip up front
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const filePromises = files.map(async (file) => {
    const { key, name } = file;

    const fileContent = await new Promise<Blob>((resolve, reject) => {
      let bytesTransferred = 0;
      const request = new XMLHttpRequest();
      request.open('GET', `${import.meta.env.VITE_R2_URL}/${key}`);

      request.onprogress = (event) => {
        bytesDownloaded += event.loaded - bytesTransferred;
        bytesTransferred = event.loaded;
        if (onProgress)
          onProgress(Math.min((bytesDownloaded / totalBytes) * 100, 100));
      };

      request.onload = () => {
        // a 403/404 body is an error page, not the file
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(`Failed to download ${name} (${request.status})`));
          return;
        }
        resolve(request.response);
        if (onProgress) onProgress((bytesDownloaded / totalBytes) * 100);
      };
      // without these the promise never settles and the download hangs
      request.onerror = () => reject(new Error(`Failed to download ${name}`));
      request.onabort = () => reject(new Error(`Download of ${name} aborted`));

      request.responseType = 'blob';
      request.send();
    });

    return { name, fileContent };
  });
  const resolvedFiles = await Promise.all(filePromises);

  // uploaders can send files with the same name; don't let them overwrite
  const used = new Set<string>();
  resolvedFiles.forEach(({ name, fileContent }) => {
    let entry = name;
    for (let n = 1; used.has(entry); n++) {
      const dot = name.lastIndexOf('.');
      entry =
        dot > 0
          ? `${name.slice(0, dot)} (${n})${name.slice(dot)}`
          : `${name} (${n})`;
    }
    used.add(entry);
    zip.file(entry, fileContent);
  });

  return zip.generateAsync({ type: 'blob' });
}
