import type {
  RequestFileUploadRequest,
  ReuqestFileUploadResponse,
} from '@shared/schemas';
import { useRef, useState } from 'react';

type UploadStatus = 'getting-url' | 'uploading' | 'complete';

type FileStatus = {
  file: File;
  status: UploadStatus;
};

export async function requestPresignedUrl(
  data: RequestFileUploadRequest,
  signal: AbortSignal,
): Promise<ReuqestFileUploadResponse> {
  return fetch('/api/files/upload-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  }).then((res) => res.json());
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

  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void,
  ): Promise<string> => {
    const abortController = new AbortController();
    abortControllers.current.set(file, abortController);
    setFileStatuses((prev) => [...prev, { file, status: 'getting-url' }]);

    let uploadUrl: string;
    try {
      uploadUrl =
        typeof getUploadUrl === 'function'
          ? await getUploadUrl(file, abortController.signal)
          : getUploadUrl;
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
        onProgress((e.loaded / e.total) * 100),
      );
      xhr.addEventListener('load', () => {
        resolve('Upload complete');
      });
      xhr.addEventListener('error', () => {
        reject(new Error('File upload failed'));
      });
      xhr.addEventListener('abort', () => {
        resolve('Upload canceled');
      });

      xhr.open('PUT', uploadUrl, true);
      xhr.send(file);
      uploadRequests.current.set(file, xhr);
    }).finally(() => {
      setStatus(file, 'complete');
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
