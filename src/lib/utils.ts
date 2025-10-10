import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Number((bytes / 1024 ** i).toFixed(i ? 1 : 0))} ${sizes[i]}`;
}

export function downloadFile(name: string, url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatTime(msLeft: number) {
  const totalSeconds = Math.floor(msLeft / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) {
    return days === 1 ? '1 day' : `${days} days`;
  }
  if (totalHours >= 1) {
    return totalHours === 1 ? '1 hour' : `${totalHours} hours`;
  }

  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return `${pad(minutes)}:${pad(seconds)}`;
}

export function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

export function uploadWithProgress(
  url: string,
  blob: Blob,
  onProgress: (e: ProgressEvent) => void,
) {
  const xhr = new XMLHttpRequest();
  return new Promise<string>((resolve, reject) => {
    xhr.upload.addEventListener('progress', onProgress);
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(xhr.getResponseHeader('etag')!.replaceAll('"', ''));
      } else {
        reject(Error('Completion failed', { cause: xhr.statusText }));
      }
    });
    xhr.addEventListener('error', () => {
      reject(Error('File upload failed'));
    });
    xhr.addEventListener('abort', () => {
      reject(Error('Upload canceled'));
    });

    xhr.open('PUT', url, true);
    xhr.send(blob);
  });
}
