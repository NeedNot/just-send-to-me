/**
 * Files are private: they are served by the worker, which checks that the
 * caller is the folder owner or the uploader who sent the file.
 */
export function fileDownloadUrl(fileId: string) {
  return `/api/files/${encodeURIComponent(fileId)}/download`;
}
