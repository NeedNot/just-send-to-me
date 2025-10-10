import { AwsClient } from 'aws4fetch';
import { XMLParser } from 'fast-xml-parser';

const S3_URL = `https://78382dff1e8ba1ce7ad866cb85aa5f39.r2.cloudflarestorage.com`; //todo get from env

export async function getObjectMetadata(
  client: AwsClient,
  { bucket, key }: { bucket: string; key: string },
) {
  const res = await client.fetch(`${S3_URL}/${bucket}/${key}`, {
    method: 'HEAD',
  });
  return res.headers;
}

export async function listMultipartUploads(
  client: AwsClient,
  { bucket, prefix }: { bucket: string; prefix?: string },
) {
  const res = await client.fetch(
    `${S3_URL}/${bucket}?uploads${prefix ? `&prefix=${prefix}` : ''}`,
    {
      method: 'GET',
    },
  );
  const xml = await res.text();
  const parser = new XMLParser();
  return parser.parse(xml);
}

export async function createMultiPartUpload(
  client: AwsClient,
  { bucket, key }: { bucket: string; key: string },
) {
  const res = await client.fetch(`${S3_URL}/${bucket}/${key}?uploads`, {
    method: 'POST',
    headers: {
      'x-amz-meta-folder': 'Hello world',
    },
  });

  const xml = await res.text();
  const parser = new XMLParser();
  return parser.parse(xml);
}

export function createPresignedPartUploadUrl(
  client: AwsClient,
  {
    bucket,
    key,
    partNumber,
    uploadId,
  }: { bucket: string; key: string; partNumber: number; uploadId: string },
) {
  const url = `${S3_URL}/${bucket}/${key}?partNumber=${partNumber}&uploadId=${uploadId}`;
  // todo size limit
  return client.sign(url, { aws: { signQuery: true }, method: 'PUT' });
}
