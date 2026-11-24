import { drizzle } from 'drizzle-orm/d1/driver';
import type { AppRouteHandler } from '../../../lib/types';
import { getFolderById } from '../../../repositories/folder-repository';
import {
  getFileWithFolder,
  toPublicFile,
} from '../../../repositories/file-repository';
import { canReadFile, resolveViewer } from '../../../lib/folder-access';
import {
  ensureUploaderId,
  getUploaderId,
} from '../../../lib/uploader-identity';
import { contentDisposition } from '../../../durable-objects/folder-uploads-object';
import type {
  AbortFileUpload,
  CompleteFileUpload,
  DownloadFileRoute,
  GetFilePartUploadUrl,
  StartUploaderSessionRoute,
  UploadNewFileRoute,
} from './routes';

const NO_UPLOADER_SESSION = {
  code: 'NO_UPLOADER_SESSION',
  message: 'Start an uploader session first',
} as const;

export const startUploaderSession: AppRouteHandler<
  StartUploaderSessionRoute
> = async (c) => {
  await ensureUploaderId(c);
  return c.body(null, 204);
};

export const uploadNewFile: AppRouteHandler<UploadNewFileRoute> = async (c) => {
  const { folderId, name, size } = c.req.valid('json');

  // Issued by POST /files/uploader-session before the first upload. Not
  // issued here: a browser starting several uploads at once would otherwise
  // get a different token per file.
  const uploaderId = await getUploaderId(c);
  if (!uploaderId) return c.json(NO_UPLOADER_SESSION, 401);

  const db = drizzle(c.env.DB);

  // verify the folder exists
  const folder = await getFolderById(db, folderId);
  if (!folder) return c.notFound();

  if (folder.expiresAt < new Date()) {
    return c.json({ message: 'Folder has expired' }, 410);
  }

  if (size + folder.size > folder.maxSize) {
    return c.json({ message: 'File is too large for folder' }, 413);
  }

  if (folder.fileCount + 1 > folder.maxFiles) {
    return c.json({ message: 'Folder has too many files' }, 413);
  }

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

  try {
    const res = await stub.startNewUpload(
      { name, size },
      folderId,
      folder.creatorId,
      uploaderId,
    );
    return c.json(res, 200);
  } catch (e: any) {
    if (e.message === 'TOO_MANY_FILES') {
      return c.json({ message: 'Folder has too many files' }, 413);
    }
    if (e.message === 'NOT_ENOUGH_SPACE') {
      return c.json({ message: 'File is too large for folder' }, 413);
    }
    console.log(e);
  }

  return c.newResponse(null, 500);
};

export const uploadFilePart: AppRouteHandler<GetFilePartUploadUrl> = async (
  c,
) => {
  const { partNumber } = c.req.param();
  const { uploadId, key } = c.req.query();

  const uploaderId = await getUploaderId(c);
  if (!uploaderId) return c.json(NO_UPLOADER_SESSION, 401);

  const folderId = key.split('/')[1];

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(folderId);
  try {
    const url = await stub.getPartUploadUrl(
      key,
      uploadId,
      partNumber,
      uploaderId,
    );
    if (!url) return c.newResponse(null, 400);
    return c.json({ url }, 200);
  } catch (e) {
    console.log(e);
    return c.newResponse(null, 400);
  }
};

export const completeFileUpload: AppRouteHandler<CompleteFileUpload> = async (
  c,
) => {
  const { uploadId, key } = c.req.query();
  const parts = c.req.valid('json');

  const uploaderId = await getUploaderId(c);
  if (!uploaderId) return c.json(NO_UPLOADER_SESSION, 401);

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(key.split('/')[1]);
  const res = await stub.completeUpload(key, uploadId, parts, uploaderId);

  if (!res) {
    return c.newResponse(null, 400);
  }
  return c.json(toPublicFile(res), 200);
};

export const abortFileUpload: AppRouteHandler<AbortFileUpload> = async (c) => {
  const { uploadId, key } = c.req.query();

  const uploaderId = await getUploaderId(c);
  if (!uploaderId) return c.json(NO_UPLOADER_SESSION, 401);

  const stub = c.env.FOLDER_UPLOADS_OBJECT.getByName(key.split('/')[1]);
  await stub.abortUpload(key, uploadId, uploaderId);
  return c.newResponse(null, 204);
};

/**
 * Streams a file from R2 after checking the caller may read it: the folder
 * owner (session cookie) or the uploader who sent it (uploader cookie).
 * Anyone else gets the same 404 as for a file that doesn't exist.
 */
export const downloadFile: AppRouteHandler<DownloadFileRoute> = async (c) => {
  const { id } = c.req.valid('param');
  const db = drizzle(c.env.DB);

  const row = await getFileWithFolder(db, id);
  if (!row) return c.notFound();

  const viewer = resolveViewer(
    row.folder,
    c.get('user'),
    await getUploaderId(c),
  );
  if (!canReadFile(viewer, row.file)) return c.notFound();

  if (row.folder.expiresAt < new Date()) {
    return c.json({ message: 'Folder expired' }, 410);
  }

  const rangeRequested = c.req.raw.headers.has('range');
  let object: R2ObjectBody | null;
  try {
    object = (await c.env.FILES_BUCKET.get(row.file.key, {
      range: rangeRequested ? c.req.raw.headers : undefined,
    })) as R2ObjectBody | null;
  } catch {
    // unsatisfiable / malformed Range
    return c.newResponse(null, 416, {
      'Content-Range': `bytes */${row.file.size}`,
    });
  }
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has('content-type')) {
    headers.set('Content-Type', 'application/octet-stream');
  }
  headers.set('Content-Disposition', contentDisposition(row.file.name));
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  // authorized per request: never let a shared cache keep a copy
  headers.set('Cache-Control', 'private, no-store');

  const range = object.range as
    { offset?: number; length?: number; suffix?: number } | undefined;
  if (rangeRequested && range) {
    const offset =
      range.suffix !== undefined
        ? object.size - range.suffix
        : (range.offset ?? 0);
    const length =
      range.suffix !== undefined
        ? range.suffix
        : (range.length ?? object.size - offset);
    headers.set(
      'Content-Range',
      `bytes ${offset}-${offset + length - 1}/${object.size}`,
    );
    headers.set('Content-Length', String(length));
    return c.newResponse(object.body, 206, Object.fromEntries(headers));
  }

  headers.set('Content-Length', String(object.size));
  return c.newResponse(object.body, 200, Object.fromEntries(headers));
};
