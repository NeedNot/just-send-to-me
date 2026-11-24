import { retry, uploadWithProgress } from '@/lib/utils';
import type { File as FolderFile, FolderView } from '@shared/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import pLimit from 'p-limit';

type UploadStatus = 'preparing' | 'uploading' | 'failed' | 'complete';

export type FileStatus = {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  size: number;
  error?: string | undefined;
  controller?: AbortController;
};

interface UploadedPart {
  partNumber: number;
  etag: string;
}

const limit = pLimit(5);

/**
 * Makes sure this browser has an uploader cookie before any upload starts.
 * Shared by all uploads on the page so parallel first uploads can't each be
 * issued a different identity.
 */
let uploaderSession: Promise<void> | null = null;
function ensureUploaderSession() {
  uploaderSession ??= fetch('/api/files/uploader-session', {
    method: 'POST',
  })
    .then((res) => {
      if (!res.ok) throw new Error('Could not start upload, please try again');
    })
    .catch((e) => {
      uploaderSession = null; // let the next upload retry
      throw e;
    });
  return uploaderSession;
}

async function errorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') return body.message as string;
  } catch {
    // not JSON
  }
  return fallback;
}

export function useFileUploader(folderId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<FileStatus[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    const id = crypto.randomUUID();
    const controller = new AbortController();

    setUploads((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'preparing',
        controller,
      },
    ]);

    try {
      const newFile = await limit(() =>
        uploadMultipartFile(
          folderId,
          file,
          (progress) => {
            setUploads((prev) =>
              prev.map((f) => (f.id === id ? { ...f, progress } : f)),
            );
          },
          controller.signal,
        ),
      );

      queryClient.setQueryData<FolderView>(['folder', folderId], (prev) =>
        prev
          ? {
              ...prev,
              size: prev.size + newFile.size,
              fileCount:
                prev.fileCount === undefined ? undefined : prev.fileCount + 1,
              files: [...prev.files, newFile],
            }
          : prev,
      );

      setUploads((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 100, status: 'complete' } : f,
        ),
      );
    } catch (e: any) {
      setUploads((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: 'failed', error: e.message ?? 'Unknown error' }
            : f,
        ),
      );
    }
  }, []);

  const abortUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target?.controller) {
        target.controller.abort();
      }
      return prev.map((u) =>
        u.id === id ? { ...u, status: 'failed', error: 'Upload canceled' } : u,
      );
    });
  }, []);

  return { upload: uploadFile, abort: abortUpload, statuses: uploads };
}

async function uploadMultipartFile(
  folderId: string,
  file: File,
  onProgress: (progress: number) => void,
  abortSignal: AbortSignal,
): Promise<FolderFile> {
  const CHUNK_SIZE = 1024 * 1024 * 10;
  let uploadId: string | undefined;
  let key: string | undefined;

  const onAbort = () => {
    if (key && uploadId) abortUpload(uploadId, key);
  };
  abortSignal.addEventListener('abort', onAbort);
  try {
    await ensureUploaderSession();
    const res = await fetch(`/api/files/upload/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderId,
        name: file.name,
        size: file.size,
      }),
      signal: abortSignal,
    });

    if (!res.ok) {
      // cookie gone (e.g. cleared mid-visit): get a new one next time
      if (res.status === 401) uploaderSession = null;
      throw new Error(await errorMessage(res, 'Failed to initiate upload'));
    }

    ({ uploadId, key } = await res.json());

    let uploadedBytes = 0;
    const uploadedMap = new Map<number, number>();

    function updateProgress(partIndex: number, loaded: number) {
      const prev = uploadedMap.get(partIndex) ?? 0;
      uploadedBytes += loaded - prev;
      uploadedMap.set(partIndex, loaded);
      onProgress(Math.min(100, (uploadedBytes / file.size) * 100));
    }

    const partCount = Math.ceil(file.size / CHUNK_SIZE);
    const uploadedParts: UploadedPart[] = [];

    const limit = pLimit(5);
    await Promise.all(
      Array.from({ length: partCount }, (_, i) =>
        limit(async () => {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const blob = file.slice(start, end);

          const etag = await retry(async () => {
            const res = await fetch(
              `/api/files/upload/part/${i + 1}?uploadId=${uploadId}&key=${key}`,
              { method: 'GET', signal: abortSignal },
            );

            if (!res.ok) {
              throw new Error(
                res.statusText || `Failed to get part ${i + 1} URL`,
              );
            }
            const { url } = await res.json();

            return await uploadWithProgress(
              url,
              blob,
              (e) => updateProgress(i, e.loaded),
              abortSignal,
            );
          });

          uploadedParts[i] = { partNumber: i + 1, etag };
        }),
      ),
    );

    return fetch(`/api/files/upload/complete?key=${key}&uploadId=${uploadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadedParts),
      signal: abortSignal,
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      throw Error(res.statusText || 'Failed to complete upload');
    });
  } finally {
  }
}

function abortUpload(uploadId: string, key: string) {
  return fetch(`/api/files/upload?uploadId=${uploadId}&key=${key}`, {
    method: 'DELETE',
  });
}
