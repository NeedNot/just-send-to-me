import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { files } from '../worker/db/schema';
import { canReadFile, resolveViewer } from '../worker/lib/folder-access';
import type { FolderUploadsObject } from '../worker/durable-objects/folder-uploads-object';
import {
  db,
  inDurableObject,
  newUploader,
  seedFile,
  seedFolder,
  seedUser,
  sessionCookie,
} from './helpers';

const ORIGIN = 'http://localhost:5173';

/**
 * Request as some browser. Each call gets its own client IP so the
 * per-IP rate limiters never trip across tests.
 */
function request(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set('cf-connecting-ip', `10.0.${rand()}.${rand()}`);
  if (init.cookie) headers.set('cookie', init.cookie);
  return SELF.fetch(new URL(path, ORIGIN), { ...init, headers });
}
const rand = () => Math.floor(Math.random() * 255);

type FolderResponse = {
  viewer: string;
  files: { id: string; name: string; key?: string }[];
  fileCount?: number;
  creatorId?: string;
};

/** Owner, two uploaders (A, B) with one file each, and one legacy file. */
async function scenario() {
  const ownerId = await seedUser();
  const folder = await seedFolder(ownerId, { maxFiles: 10 });
  const a = await newUploader();
  const b = await newUploader();
  const fileA = await seedFile(folder, {
    name: 'a.txt',
    body: 'from A',
    uploaderId: a.uploaderId,
  });
  const fileB = await seedFile(folder, {
    name: 'b.txt',
    body: 'from B',
    uploaderId: b.uploaderId,
  });
  const legacy = await seedFile(folder, { name: 'old.txt', body: 'legacy' });
  return {
    folder,
    owner: { cookie: await sessionCookie(ownerId) },
    a,
    b,
    fileA,
    fileB,
    legacy,
  };
}

async function getFolder(id: string, cookie?: string) {
  const res = await request(`/api/folders/${id}`, { cookie });
  expect(res.status).toBe(200);
  return (await res.json()) as FolderResponse;
}

describe('folder listing', () => {
  it('owner sees every file, including untagged legacy ones', async () => {
    const s = await scenario();
    const folder = await getFolder(s.folder.id, s.owner.cookie);

    expect(folder.viewer).toBe('owner');
    expect(folder.files.map((f) => f.name).sort()).toEqual([
      'a.txt',
      'b.txt',
      'old.txt',
    ]);
    expect(folder.creatorId).toBe(s.folder.creatorId);
  });

  it('uploader sees only their own files and nothing about the others', async () => {
    const s = await scenario();
    const folder = await getFolder(s.folder.id, s.a.cookie);

    expect(folder.viewer).toBe('uploader');
    expect(folder.files.map((f) => f.id)).toEqual([s.fileA.id]);
    // no count / creator that would reveal other uploads
    expect(folder).not.toHaveProperty('fileCount');
    expect(folder).not.toHaveProperty('creatorId');
    // R2 keys and uploader ids never leave the server
    expect(folder.files[0]).not.toHaveProperty('key');
    expect(folder.files[0]).not.toHaveProperty('uploaderId');
  });

  it('stranger without a cookie sees no files', async () => {
    const s = await scenario();
    const folder = await getFolder(s.folder.id);

    expect(folder.viewer).toBe('visitor');
    expect(folder.files).toEqual([]);
    expect(folder).not.toHaveProperty('fileCount');
  });

  it('a browser with an uploader cookie but no uploads here sees no files', async () => {
    const s = await scenario();
    const other = await newUploader();
    const folder = await getFolder(s.folder.id, other.cookie);

    expect(folder.viewer).toBe('uploader');
    expect(folder.files).toEqual([]);
  });

  it('a signed-in user who is not the owner is treated like anyone else', async () => {
    const s = await scenario();
    const otherUser = await sessionCookie(await seedUser());
    const folder = await getFolder(s.folder.id, otherUser);

    expect(folder.viewer).toBe('visitor');
    expect(folder.files).toEqual([]);
  });

  it('ignores a malformed uploader cookie', async () => {
    const s = await scenario();
    const folder = await getFolder(s.folder.id, 'jstm_uploader=not-a-token');
    expect(folder.viewer).toBe('visitor');
  });
});

describe('file download', () => {
  it('owner can download any file', async () => {
    const s = await scenario();
    for (const [file, body] of [
      [s.fileA, 'from A'],
      [s.fileB, 'from B'],
      [s.legacy, 'legacy'],
    ] as const) {
      const res = await request(`/api/files/${file.id}/download`, {
        cookie: s.owner.cookie,
      });
      expect(res.status).toBe(200);
      expect(await res.text()).toBe(body);
      expect(res.headers.get('content-disposition')).toContain(
        `filename="${file.name}"`,
      );
      expect(res.headers.get('cache-control')).toBe('private, no-store');
    }
  });

  it('uploader can download their own file', async () => {
    const s = await scenario();
    const res = await request(`/api/files/${s.fileA.id}/download`, {
      cookie: s.a.cookie,
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('from A');
  });

  it("refuses an uploader's request for another uploader's file", async () => {
    const s = await scenario();
    const res = await request(`/api/files/${s.fileB.id}/download`, {
      cookie: s.a.cookie,
    });
    // same answer as a file that doesn't exist: no existence oracle
    expect(res.status).toBe(404);
    await res.body?.cancel();
  });

  it('refuses uploaders access to untagged legacy files', async () => {
    const s = await scenario();
    const res = await request(`/api/files/${s.legacy.id}/download`, {
      cookie: s.a.cookie,
    });
    expect(res.status).toBe(404);
    await res.body?.cancel();
  });

  it('refuses strangers', async () => {
    const s = await scenario();
    for (const cookie of [
      undefined,
      (await newUploader()).cookie,
      await sessionCookie(await seedUser()),
    ]) {
      const res = await request(`/api/files/${s.fileA.id}/download`, {
        cookie,
      });
      expect(res.status).toBe(404);
      await res.body?.cancel();
    }
  });

  it('returns 410 once the folder has expired', async () => {
    const ownerId = await seedUser();
    const folder = await seedFolder(ownerId, {
      expiresAt: new Date(Date.now() - 1000),
    });
    const file = await seedFile(folder);
    const res = await request(`/api/files/${file.id}/download`, {
      cookie: await sessionCookie(ownerId),
    });
    expect(res.status).toBe(410);
    await res.body?.cancel();
  });

  it('serves byte ranges', async () => {
    const s = await scenario();
    const res = await request(`/api/files/${s.fileA.id}/download`, {
      cookie: s.a.cookie,
      headers: { range: 'bytes=0-3' },
    });
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 0-3/6');
    expect(await res.text()).toBe('from');
  });
});

describe('uploader session', () => {
  it('issues an httpOnly, SameSite=Strict cookie and reuses it', async () => {
    const res = await request('/api/files/uploader-session', {
      method: 'POST',
    });
    expect(res.status).toBe(204);
    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toMatch(/^jstm_uploader=[A-Za-z0-9_-]{43};/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/');

    // an existing token is kept (only its lifetime is refreshed)
    const cookie = setCookie.split(';')[0];
    const again = await request('/api/files/uploader-session', {
      method: 'POST',
      cookie,
    });
    expect(again.headers.get('set-cookie')!.split(';')[0]).toBe(cookie);
  });

  it('uses a Secure __Host- cookie over HTTPS', async () => {
    const res = await SELF.fetch(
      'https://justsendto.me/api/files/uploader-session',
      {
        method: 'POST',
        headers: { 'cf-connecting-ip': `10.1.${rand()}.${rand()}` },
      },
    );
    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toMatch(/^__Host-jstm_uploader=/);
    expect(setCookie).toContain('Secure');
    expect(setCookie).not.toContain('Domain');

    // and reads it back from the prefixed name
    const ownerId = await seedUser();
    const folder = await seedFolder(ownerId);
    const up = await newUploader({ secure: true });
    const file = await seedFile(folder, { uploaderId: up.uploaderId });
    const list = await SELF.fetch(
      `https://justsendto.me/api/folders/${folder.id}`,
      {
        headers: {
          cookie: up.cookie,
          'cf-connecting-ip': `10.1.${rand()}.${rand()}`,
        },
      },
    );
    const body = (await list.json()) as FolderResponse;
    expect(body.files.map((f) => f.id)).toEqual([file.id]);
  });
});

describe('upload flow', () => {
  async function startUpload(folderId: string, cookie?: string) {
    return request('/api/files/upload/new', {
      method: 'POST',
      cookie,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ folderId, name: 'up.txt', size: 2 }),
    });
  }

  it('refuses to start an upload without an uploader session', async () => {
    const folder = await seedFolder(await seedUser());
    const res = await startUpload(folder.id);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'NO_UPLOADER_SESSION' });
  });

  it("tags the file with the uploader, and another uploader can't hijack the upload", async () => {
    const folder = await seedFolder(await seedUser());
    const a = await newUploader();
    const b = await newUploader();

    const started = await startUpload(folder.id, a.cookie);
    expect(started.status).toBe(200);
    const { key, uploadId } = (await started.json()) as {
      key: string;
      uploadId: string;
    };
    const part = await env.FILES_BUCKET.resumeMultipartUpload(
      key,
      uploadId,
    ).uploadPart(1, 'hi');
    const parts = JSON.stringify([
      { partNumber: part.partNumber, etag: part.etag },
    ]);
    const query = `key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}`;

    // B can't get part URLs for, complete, or abort A's upload
    const partUrl = await request(`/api/files/upload/part/1?${query}`, {
      cookie: b.cookie,
    });
    expect(partUrl.status).toBe(400);
    await partUrl.body?.cancel();
    const hijack = await request(`/api/files/upload/complete?${query}`, {
      method: 'POST',
      cookie: b.cookie,
      headers: { 'content-type': 'application/json' },
      body: parts,
    });
    expect(hijack.status).toBe(400);
    await hijack.body?.cancel();
    const abort = await request(`/api/files/upload?${query}`, {
      method: 'DELETE',
      cookie: b.cookie,
    });
    expect(abort.status).toBe(204);

    // A's upload is untouched and completes
    const done = await request(`/api/files/upload/complete?${query}`, {
      method: 'POST',
      cookie: a.cookie,
      headers: { 'content-type': 'application/json' },
      body: parts,
    });
    expect(done.status).toBe(200);
    const file = (await done.json()) as { id: string };
    expect(file).not.toHaveProperty('key');

    const row = await db()
      .select()
      .from(files)
      .where(eq(files.id, file.id))
      .get();
    expect(row?.uploaderId).toBe(a.uploaderId);

    // and shows up for A only
    expect((await getFolder(folder.id, a.cookie)).files).toHaveLength(1);
    expect((await getFolder(folder.id, b.cookie)).files).toHaveLength(0);
  });
});

describe('FolderUploadsObject schema migration', () => {
  it('adds uploader_id to a pending_files table created by the old schema', async () => {
    const folder = await seedFolder(await seedUser());
    const stub = env.FOLDER_UPLOADS_OBJECT.getByName(folder.id);
    await inDurableObject(stub, (instance: FolderUploadsObject) => {
      instance.sql.exec('DROP TABLE pending_files');
      instance.sql.exec(
        'CREATE TABLE pending_files(key TEXT PRIMARY KEY, size INTEGER, last_active INTEGER)',
      );
      instance.migratePendingFiles();
      instance.migratePendingFiles(); // idempotent
      const columns = instance.sql
        .exec<{ name: string }>('PRAGMA table_info(pending_files)')
        .toArray()
        .map((c) => c.name);
      expect(columns).toContain('uploader_id');
    });
  });
});

describe('access rules', () => {
  const folder = { creatorId: 'owner' };

  it('resolves owner before uploader', () => {
    expect(resolveViewer(folder, { id: 'owner' }, 'u1').role).toBe('owner');
    expect(resolveViewer(folder, { id: 'someone' }, 'u1')).toEqual({
      role: 'uploader',
      uploaderId: 'u1',
    });
    expect(resolveViewer(folder, null, null).role).toBe('visitor');
  });

  it('only matches non-null uploader ids', () => {
    const owner = resolveViewer(folder, { id: 'owner' }, null);
    const u1 = resolveViewer(folder, null, 'u1');
    const visitor = resolveViewer(folder, null, null);

    expect(canReadFile(owner, { uploaderId: null })).toBe(true);
    expect(canReadFile(owner, { uploaderId: 'u2' })).toBe(true);
    expect(canReadFile(u1, { uploaderId: 'u1' })).toBe(true);
    expect(canReadFile(u1, { uploaderId: 'u2' })).toBe(false);
    expect(canReadFile(u1, { uploaderId: null })).toBe(false);
    expect(canReadFile(visitor, { uploaderId: null })).toBe(false);
  });
});
