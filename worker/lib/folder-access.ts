/**
 * Who may see which files in a folder. Every route that lists or downloads
 * files goes through these functions, so the rules live in one place. A
 * future "uploader deletes own file" route should resolve the viewer the
 * same way and add a canDeleteFile next to canReadFile.
 */

export type Viewer =
  | { role: 'owner'; userId: string }
  | { role: 'uploader'; uploaderId: string }
  | { role: 'visitor' };

export function resolveViewer(
  folder: { creatorId: string },
  user: { id: string } | null | undefined,
  uploaderId: string | null,
): Viewer {
  if (user && user.id === folder.creatorId) {
    return { role: 'owner', userId: user.id };
  }
  if (uploaderId) return { role: 'uploader', uploaderId };
  return { role: 'visitor' };
}

/**
 * Read access (list / download). The owner can read every file; an uploader
 * only files tagged with their own id. Untagged (pre-existing) files are
 * owner-only.
 */
export function canReadFile(
  viewer: Viewer,
  file: { uploaderId: string | null },
) {
  if (viewer.role === 'owner') return true;
  if (viewer.role === 'uploader') {
    return file.uploaderId !== null && file.uploaderId === viewer.uploaderId;
  }
  return false;
}
