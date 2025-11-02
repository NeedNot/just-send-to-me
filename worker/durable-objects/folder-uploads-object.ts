import { DurableObject } from 'cloudflare:workers';
import {
  addFileMetaToFolder,
  getFolderById,
} from '../repositories/folder-repository';
import { drizzle } from 'drizzle-orm/d1/driver';
import { MS_IN_MINUTE } from '../../shared/constants';
import { createId } from '@paralleldrive/cuid2';
import { createAwsClient } from '../lib/s3';
import {
  createPresignedPartUploadUrl,
  listMultipartUploads,
} from '../repositories/s3-repository';
import { insertFile } from '../repositories/file-repository';

// todo needs a way to self delete
interface PendingFile {
  size: number;
  lastActive: number;
}

const CHUNK_SIZE = 1024 ** 2 * 10;
const bucket = process.env.R2_FILES_BUCKET!;

export class FolderUploadsObject extends DurableObject<Env> {
  // states are optimistic
  initialized = false;
  remainingFiles: number = 0;
  remainingSpace: number = 0;
  pendingFiles: Map<string, PendingFile> = new Map(); //todo delete?
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = this.ctx.storage.sql;
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS pending_files(key TEXT PRIMARY KEY, size INTEGER, last_active INTEGER); CREATE TABLE IF NOT EXISTS abort_queue (key TEXT PRIMARY KEY)`,
    );

    this.ctx.blockConcurrencyWhile(async () => {
      const id: string | undefined = await this.ctx.storage.get('folderId');

      if (!id) return;
      this.initialized = true;
      this.remainingFiles = (await this.ctx.storage.get('remainingFiles')) || 0;
      this.remainingSpace = (await this.ctx.storage.get('remainingSpace')) || 0;
      const pendingFilesRes = this.sql
        .exec<{
          key: string;
          size: number;
          last_active: number;
        }>('SELECT * FROM pending_files')
        .toArray();
      this.pendingFiles = new Map(
        pendingFilesRes.map((r) => [
          r.key,
          { size: r.size, lastActive: r['last_active'] },
        ]),
      );
    });
  }

  private async init(id: string) {
    this.initialized = true;
    const db = drizzle(this.env.DB);
    await this.ctx.storage.put('folderId', id);
    const folder = await getFolderById(db, id);
    if (!folder) {
      this.ctx.abort("Folder doesn't exist");
      return;
    }
    this.remainingFiles = folder.maxFiles - folder.fileCount;
    this.remainingSpace = folder.maxSize - folder.size;
    await Promise.all([
      this.ctx.storage.put('remainingFiles', this.remainingFiles),
      this.ctx.storage.put('remainingSpace', this.remainingSpace),
    ]);
  }

  async alarm(_?: AlarmInvocationInfo): Promise<void> {
    const queue = this.sql
      .exec<{ key: string }>('DELETE FROM abort_queue RETURNING *')
      .toArray()
      .map((r) => r.key);
    if (queue.length === 0) return;

    const awsClient = createAwsClient(this.env);

    const promises = queue.map(async (key) => {
      const upload = await listMultipartUploads(awsClient, {
        bucket,
        prefix: key,
      });
      if (!upload.Upload || !upload.Upload[0].UploadId) {
        return;
      }
      const session = this.env.FILES_BUCKET.resumeMultipartUpload(
        key,
        upload.Upload[0].UploadId,
      );
      await session.abort();
    });
    await Promise.all(promises);
  }

  async startNewUpload(
    file: { name: string; size: number },
    folderId: string,
    creatorId: string,
  ) {
    if (!this.initialized) {
      await this.ctx.blockConcurrencyWhile(() => this.init(folderId));
    }

    // upload not possible unless a file is canceled
    if (this.remainingFiles <= 0 || this.remainingSpace < file.size) {
      if (this.pendingFiles.size === 0)
        throw new Error(
          this.remainingSpace <= 0
            ? 'File is too large for folder'
            : 'Folder has too many files',
        );

      const cancellableUploads = this.findCancellableUploads(file.size);
      cancellableUploads.forEach((key) => {
        this.sql.exec(
          'INSERT OR IGNORE INTO abort_queue (key) VALUES (?)',
          key,
        );
        this.remainingFiles += 1;
        this.remainingSpace += this.pendingFiles.get(key)!.size;
        this.pendingFiles.delete(key);
        this.ctx.storage.put('remainingFiles', this.remainingFiles);
        this.ctx.storage.put('remainingSpace', this.remainingSpace);
        this.sql.exec('DELETE FROM pending_files WHERE key = ?', key);
      });

      const currentAlarm = await this.ctx.storage.getAlarm();
      if (!currentAlarm) {
        const timeInFuture = Date.now() + MS_IN_MINUTE / 2;
        await this.ctx.storage.setAlarm(timeInFuture);
      }
    }

    const id = createId();
    const key = `${creatorId}/${folderId}/${id}`;
    const res = await this.env.FILES_BUCKET.createMultipartUpload(key, {
      customMetadata: {
        folderId: folderId,
        name: file.name,
      },

      httpMetadata: {
        contentDisposition: `attachment; filename="${file.name}"`,
      },
    });
    this.pendingFiles.set(key, {
      size: file.size,
      lastActive: Date.now(),
    });
    this.remainingFiles -= 1;
    this.remainingSpace -= file.size;

    this.sql.exec(
      'INSERT INTO pending_files (key, size, last_active) VALUES (?, ?, ?)',
      key,
      file.size,
      Date.now(),
    );
    await Promise.all([
      this.ctx.storage.put('remainingFiles', this.remainingFiles),
      this.ctx.storage.put('remainingSpace', this.remainingSpace),
    ]);

    return { uploadId: res.uploadId, key: res.key };
  }

  async getPartUploadUrl(key: string, uploadId: string, partNumber: string) {
    const upload = this.pendingFiles.get(key);
    if (!upload) throw Error('Upload not found');

    if (Math.ceil(upload.size / CHUNK_SIZE) < parseInt(partNumber)) {
      throw Error('Part number is too large');
    }

    const contentLength = String(
      upload.size >= parseInt(partNumber) * CHUNK_SIZE
        ? CHUNK_SIZE
        : upload.size % CHUNK_SIZE,
    );

    const awsClient = createAwsClient(this.env);
    const signedUrl = await createPresignedPartUploadUrl(awsClient, {
      bucket,
      partNumber: parseInt(partNumber),
      uploadId,
      key,
      contentLength,
    });

    this.pendingFiles.set(key, {
      ...upload,
      lastActive: Date.now(),
    });

    this.sql.exec(
      'UPDATE pending_files SET last_active = ? WHERE key = ?',
      Date.now(),
      key,
    );

    return signedUrl.url;
  }

  async completeUpload(key: string, uploadId: string, parts: R2UploadedPart[]) {
    const session = this.env.FILES_BUCKET.resumeMultipartUpload(key, uploadId);

    try {
      await session.complete(parts);
    } catch (e) {
      console.log(e);
      return null;
    }

    const objectHead = await this.env.FILES_BUCKET.head(key);
    const upload = this.pendingFiles.get(key);

    if (
      !upload ||
      !objectHead?.customMetadata ||
      upload.size !== objectHead.size
    ) {
      await this.env.FILES_BUCKET.delete(key);
      return null;
    }

    const db = drizzle(this.env.DB);
    try {
      const res = await insertFile(db, objectHead);
      await addFileMetaToFolder(db, res);
      this.pendingFiles.delete(key);
      this.sql.exec('DELETE FROM pending_files WHERE key = ?', key);
      return res;
    } catch (e) {
      console.log(e);
      await this.env.FILES_BUCKET.delete(key);
      return null;
    }
  }

  async abortUpload(key: string, uploadId: string) {
    const session = this.env.FILES_BUCKET.resumeMultipartUpload(key, uploadId);
    session.abort();
    const upload = this.pendingFiles.get(key);
    if (upload) {
      this.pendingFiles.delete(key);
      this.remainingFiles += 1;
      this.remainingSpace += upload.size;
      this.sql.exec('DELETE FROM pending_files WHERE key = ?', key);
      this.ctx.storage.put('remainingFiles', this.remainingFiles);
      this.ctx.storage.put('remainingSpace', this.remainingSpace);
    }
  }

  private findCancellableUploads(size: number): Set<string> {
    const cutoff = Date.now() - 1.5 * MS_IN_MINUTE;

    const pendingEntries = Array.from(this.pendingFiles.entries());

    const overflow = size - this.remainingSpace;

    if (overflow <= 0 && this.remainingFiles > 0) {
      return new Set();
    }

    const cancellable = pendingEntries
      .filter(([, f]) => f.lastActive < cutoff)
      .sort((a, b) => b[1].size - a[1].size);

    let freedSpace = 0;
    let freedFiles = 0;
    const toAbort = new Set<string>();

    for (const [key, file] of cancellable) {
      toAbort.add(key);
      freedSpace += file.size;
      freedFiles += 1;
      if (freedSpace >= overflow && this.remainingFiles + freedFiles > 0) break;
    }

    if (this.remainingFiles + toAbort.size <= 0) {
      throw Error('TOO_MANY_FILES');
    }
    if (freedSpace < overflow) {
      throw Error('NOT_ENOUGH_SPACE');
    }

    return toAbort;
  }
}
