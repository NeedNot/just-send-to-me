import type {
  RequestFileUploadRequest,
  ReuqestFileUploadResponse,
} from '@shared/schemas';
import { useRef, useState } from 'react';

type UploadStatus = 'getting-url' | 'uploading' | 'failed' | 'complete';

export type FileStatus = {
  file: File;
  status: UploadStatus;
  progress: number;
};

export async function requestPresignedUrl(
  data: RequestFileUploadRequest,
  signal: AbortSignal,
): Promise<ReuqestFileUploadResponse> {
  const res = await fetch('/api/files/upload-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok)
    throw Error('Failed to get presigned url', { cause: res.status });
  return res.json();
}

export function useFileUploader(
  getUploadUrl: (file: File, signal: AbortSignal) => Promise<string> | string,
) {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const uploadRequests = useRef<Map<File, XMLHttpRequest>>(new Map());
  const abortControllers = useRef<Map<File, AbortController>>(new Map());

  const setStatus = (file: File, status: UploadStatus) => {
    setFileStatuses((prev) =>
      prev.map((f) => (f.file === file ? { ...f, status } : f)),
    );
  };

  const uploadFile = async (file: File): Promise<string> => {
    const abortController = new AbortController();
    abortControllers.current.set(file, abortController);
    setFileStatuses((prev) => [
      ...prev,
      { file, status: 'getting-url', progress: 0 },
    ]);

    let uploadUrl: string;
    try {
      uploadUrl =
        typeof getUploadUrl === 'function'
          ? await getUploadUrl(file, abortController.signal)
          : getUploadUrl;
      if (!uploadUrl) throw Error('Unable to fetch upload url');
    } catch (e) {
      if (abortController.signal.aborted) {
        return 'Upload canceled';
      }
      throw e;
    }

    setStatus(file, 'uploading');
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) =>
        setFileStatuses((prev) =>
          prev.map((f) =>
            f.file == file ? { ...f, progress: (e.loaded / e.total) * 100 } : f,
          ),
        ),
      );
      xhr.addEventListener('load', () => {
        resolve('Upload complete');
      });
      xhr.addEventListener('error', () => {
        reject('File upload failed');
      });
      xhr.addEventListener('abort', () => {
        reject('Upload canceled');
      });

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader(
        'Content-Disposition',
        `attachment; filename="${file.name}"`,
      );
      xhr.send(file);
      uploadRequests.current.set(file, xhr);
    })
      .then((result) => {
        setStatus(file, 'complete');
        return result;
      })
      .catch((error) => {
        setStatus(file, 'failed');
        throw error;
      })
      .finally(() => {
        abortControllers.current.delete(file);
        uploadRequests.current.delete(file);
      });
  };

  const abortUpload = (file: File) => {
    abortControllers.current.get(file)?.abort();
    uploadRequests.current.get(file)?.abort();
  };
  return { uploadFile, abortUpload, fileStatuses };
}
