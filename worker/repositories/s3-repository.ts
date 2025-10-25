import { AwsClient } from 'aws4fetch';
import { XMLParser } from 'fast-xml-parser';

const S3_URL = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

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
): Promise<{
  Upload?: { UploadId: string; Key: string; Initiated: string }[];
}> {
  const res = await client.fetch(
    `${S3_URL}/${bucket}?uploads${prefix ? `&prefix=${prefix}` : ''}`,
    {
      method: 'GET',
    },
  );
  const xml = await res.text();
  const parser = new XMLParser();
  const multipartUploadResult = parser.parse(xml)['ListMultipartUploadsResult'];
  return {
    ...multipartUploadResult,
    Upload: multipartUploadResult.Upload
      ? Array.isArray(multipartUploadResult.Upload)
        ? multipartUploadResult.Upload
        : [multipartUploadResult.Upload]
      : undefined,
  };
}

export function createPresignedPartUploadUrl(
  client: AwsClient,
  {
    bucket,
    key,
    partNumber,
    uploadId,
    contentLength,
  }: {
    bucket: string;
    key: string;
    partNumber: number;
    uploadId: string;
    contentLength: string;
  },
) {
  const url = `${S3_URL}/${bucket}/${key}?partNumber=${partNumber}&uploadId=${uploadId}`;
  return client.sign(url, {
    aws: { signQuery: true, allHeaders: true },
    headers: { 'Content-Length': contentLength },
    method: 'PUT',
  });
}
