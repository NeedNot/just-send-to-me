import { env } from 'cloudflare:test';
import { app } from '../../worker';
import { describe, it, expect, beforeAll } from 'vitest';
import { Folder, createFileResponseSchema } from '../../shared/schemas';
import z from 'zod';

let createdFolderId: string;

beforeAll(async () => {
  const req = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: 'test',
      expiration: '7d',
    }),
  };

  const res = await app.request('/api/folders/new', req, env);
  expect(res.status).toBe(200);

  const body: Folder = await res.json();
  expect(body).toHaveProperty('id');
  expect(body.name).toBe('test');

  // Save folder ID for future tests
  createdFolderId = body.id;
});

describe('Folder API', () => {
  it('should retrieve a folder by id', async () => {
    expect(createdFolderId).not.toBeUndefined();
    const req = {
      method: 'GET',
    };
    const res = await app.request(`/api/folders/${createdFolderId}`, req, env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('id', createdFolderId);
    expect(body).toHaveProperty('name', 'test');
  });

  it('should return 404 if folder not found', async () => {
    const req = {
      method: 'GET',
    };
    const res = await app.request(`/api/folders/non-existent-id`, req, env);

    expect(res.status).toBe(404);
  });
});

describe('File upload API flow', () => {
  it('should request an upload and complete it', async () => {
    const uploadFileRequestReq = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        folderId: createdFolderId,
        name: 'test.txt',
        size: 11,
      }),
    };

    const uploadRequestRes = await app.request(
      '/api/files/upload-request',
      uploadFileRequestReq,
      env,
    );

    expect(uploadRequestRes.status).toBe(200);
    const uploadRequestBody: z.infer<typeof createFileResponseSchema> =
      await uploadRequestRes.json();

    const putFileReq = {
      method: 'PUT',
      headers: { 'content-length': '11', 'content-type': 'text/plain' },
      body: 'Hello World',
    };

    const putFileRes = await fetch(uploadRequestBody.signedUrl, putFileReq);
    expect(putFileRes.status).toBe(200);
  });
});
