import type {
  RequestFileUploadRequest,
  ReuqestFileUploadResponse,
} from '@shared/schemas';
import { useRef } from 'react';

export async function requestPresignedUrl(
  data: RequestFileUploadRequest,
): Promise<ReuqestFileUploadResponse> {
  return fetch('/api/files/upload-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export function useFileUploader(
  getUploadUrl: (file: File) => Promise<string> | string,
) {
  const activeRequests = useRef<Map<File, XMLHttpRequest>>(new Map());

  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void,
  ) => {
    const uploadUrl =
      typeof getUploadUrl === 'function'
        ? await getUploadUrl(file)
        : getUploadUrl;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) =>
        onProgress((e.loaded / e.total) * 100),
      );
      xhr.addEventListener('load', () =>
        resolve({ status: xhr.status, body: xhr.responseText }),
      );
      xhr.addEventListener('error', () =>
        reject(new Error('File upload failed')),
      );
      xhr.addEventListener('abort', () =>
        reject(new Error('File upload aborted')),
      );

      xhr.open('PUT', uploadUrl, true);
      xhr.send(file);
      activeRequests.current.set(file, xhr);
    });
  };

  const abortUpload = (file: File) => {
    activeRequests.current.get(file)?.abort();
  };
  return { uploadFile, abortUpload };
}
