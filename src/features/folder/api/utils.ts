import type { Folder, File } from '@shared/schemas';

export function replaceFileInFolder(folder: Folder, file: File) {
  return folder.files?.map((f) => (f.id === file.id ? file : f)) ?? [file];
}
