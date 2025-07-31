import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';

export interface AppBindings {
  Bindings: Env;
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

export interface EventNotification {
  account: string;
  action:
    | 'PutObject'
    | 'CopyObject'
    | 'CompleteMultipartUpload'
    | 'DeleteObject';
  bucket: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
  eventTime: string;
  copySource?: {
    key: string;
    bucket?: string;
  };
}
