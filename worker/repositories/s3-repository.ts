import { AwsClient } from 'aws4fetch';

const S3_URL = `http://localhost:4566`;

export function getAwsClient() {
  return new AwsClient({
    accessKeyId: 'test',
    secretAccessKey: 'test',
    region: 'autoo',
    service: 's3',
  });
}

export async function createPresignedFileUploadUrl(
  client: AwsClient,
  {
    bucket,
    key,
    size,
  }: {
    bucket: string;
    key: string;
    size: number;
  },
) {
  const x = await client.sign(
    `${S3_URL}/${bucket}/${key}?X-Amz-Expires=300&If-None-Match=*`,
    {
      method: 'PUT',
      aws: { signQuery: true, allHeaders: true },
      headers: {
        'content-length': size.toString(),
      },
    },
  );
  return x.url.toString();
}

export async function getObjectMetadata(
  client: AwsClient,
  { bucket, key }: { bucket: string; key: string },
) {
  const res = await client.fetch(`${S3_URL}/${bucket}/${key}`, {
    method: 'HEAD',
  });
  return res.headers;
}
