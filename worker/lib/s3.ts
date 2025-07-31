import { AwsClient } from 'aws4fetch';

export function createAwsClient(env: Env) {
  return new AwsClient({
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
    service: 's3',
  });
}
