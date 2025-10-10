import { uploadWithProgress } from '@/lib/utils';
import type { Folder } from '@shared/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { constrainedMemory } from 'process';
import { useCallback, useState } from 'react';

type UploadStatus = 'preparing' | 'uploading' | 'failed' | 'complete';

export type FileStatus = {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  size: number;
  error?: string | undefined;
};

interface UploadedPart {
  partNumber: number;
  etag: string;
}

export function useFileUploader(folderId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<FileStatus[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    const id = crypto.randomUUID();
    setUploads((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'preparing',
      },
    ]);

    try {
      const newFile = await uploadMultipartFile(folderId, file, (progress) => {
        setUploads((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress } : f)),
        );
      });

      queryClient.setQueryData(['folder', folderId], (prev: Folder) => ({
        ...prev,
        size: prev.size + newFile.size,
        files: [...(prev.files ?? []), newFile],
      }));

      setUploads((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: 100, status: 'complete' } : f,
        ),
      );
    } catch (e: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: 'failed', error: e.message ?? 'Unknown error' }
            : u,
        ),
      );
    }
  }, []);

  return { upload: uploadFile, statuses: uploads };
}

async function uploadMultipartFile(
  folderId: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  const CHUNK_SIZE = 1024 * 1024 * 10;
  const { uploadId, key } = await fetch(`/api/files/upload/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folderId,
      name: file.name,
      size: file.size,
    }),
  }).then((res) => res.json());

  const partCount = Math.ceil(file.size / CHUNK_SIZE);
  const uploadedParts: UploadedPart[] = [];

  for (let i = 0; i < partCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);

    const { url } = await fetch(
      `/api/files/upload/part/${i + 1}?uploadId=${uploadId}&key=${key}`,
      { method: 'GET' },
    ).then((res) => res.json());

    // todo make this return to use it in the uploaded parts
    const etag = await uploadWithProgress(url, blob, (e) => {
      const totalUploaded = i * CHUNK_SIZE + e.loaded;
      onProgress(Math.min(100, (totalUploaded / file.size) * 100));
    });

    uploadedParts.push({
      partNumber: i + 1,
      etag,
    });
  }

  return fetch(`/api/files/upload/complete?key=${key}&uploadId=${uploadId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uploadedParts),
  }).then((res) => {
    if (res.ok) {
      return res.json();
    }
    throw Error(res.statusText);
  });
}
