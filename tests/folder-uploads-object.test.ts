import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import {
  contentDisposition,
  type FolderUploadsObject,
} from '../worker/durable-objects/folder-uploads-object';
import { inDurableObject, seedFolder, seedUser } from './helpers';

describe('FolderUploadsObject', () => {
  it('starts an upload and tracks remaining space/files', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId);
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

    const res = await stub.startNewUpload(
      { name: 'a.txt', size: 400 },
      folder.id,
      userId,
    );
    expect(res.key.startsWith(`${userId}/${folder.id}/`)).toBe(true);

    await inDurableObject(stub, (instance: FolderUploadsObject) => {
      expect(instance.remainingSpace).toBe(600);
      expect(instance.remainingFiles).toBe(2);
    });
  });

  it('rejects with NOT_ENOUGH_SPACE when the folder is full and nothing is pending', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId, { maxSize: 100 });
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

    await inDurableObject(stub, async (instance: FolderUploadsObject) => {
      await expect(
        instance.startNewUpload(
          { name: 'big.bin', size: 101 },
          folder.id,
          userId,
        ),
      ).rejects.toThrow('NOT_ENOUGH_SPACE');
    });
  });

  it('rejects with TOO_MANY_FILES when the file limit is reached and nothing is pending', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId, { maxFiles: 0 });
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

    await inDurableObject(stub, async (instance: FolderUploadsObject) => {
      await expect(
        instance.startNewUpload({ name: 'a.txt', size: 1 }, folder.id, userId),
      ).rejects.toThrow('TOO_MANY_FILES');
    });
  });

  it('keeps accepting uploads after the clean-up alarm wiped storage', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId);
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

    const first = await stub.startNewUpload(
      { name: 'a.txt', size: 10 },
      folder.id,
      userId,
    );
    await stub.abortUpload(first.key, first.uploadId);
    await inDurableObject(stub, (instance: FolderUploadsObject) =>
      instance.handleCleanUpAlarm(),
    );

    const second = await stub.startNewUpload(
      { name: 'b.txt', size: 10 },
      folder.id,
      userId,
    );
    expect(second.uploadId).toBeTruthy();
  });

  it('completes an upload and records the file under the id from its key', async () => {
    const userId = await seedUser();
    const folder = await seedFolder(userId);
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);

    const body = 'hi'; // 2 bytes: the old id lookup used size as an index
    const { key, uploadId } = await stub.startNewUpload(
      { name: 'hi.txt', size: body.length },
      folder.id,
      userId,
    );
    const part = await env.FILES_BUCKET.resumeMultipartUpload(
      key,
      uploadId,
    ).uploadPart(1, body);

    const file = await stub.completeUpload(key, uploadId, [part]);
    expect(file).not.toBeNull();
    expect(file!.id).toBe(key.split('/').at(-1));
    expect(file!.size).toBe(2);
  });
});

describe('contentDisposition', () => {
  it('produces an ASCII-safe header with the exact UTF-8 name', () => {
    expect(contentDisposition('report.pdf')).toBe(
      `attachment; filename="report.pdf"; filename*=UTF-8''report.pdf`,
    );
    const header = contentDisposition('写真 "1".jpg');
    expect(header).toMatch(/^[\x20-\x7e]+$/);
    expect(header).toContain(`filename="__ _1_.jpg"`);
    expect(header).toContain(
      `filename*=UTF-8''%E5%86%99%E7%9C%9F%20%221%22.jpg`,
    );
  });
});

describe('uploadNewFileSchema', () => {
  it('rejects negative, fractional and zero sizes', async () => {
    const { uploadNewFileSchema } = await import('../shared/schemas');
    const base = { folderId: 'abc123', name: 'a.txt' };
    expect(uploadNewFileSchema.safeParse({ ...base, size: -1 }).success).toBe(
      false,
    );
    expect(uploadNewFileSchema.safeParse({ ...base, size: 1.5 }).success).toBe(
      false,
    );
    expect(uploadNewFileSchema.safeParse({ ...base, size: 0 }).success).toBe(
      false,
    );
    expect(uploadNewFileSchema.safeParse({ ...base, size: 10 }).success).toBe(
      true,
    );
  });
});
