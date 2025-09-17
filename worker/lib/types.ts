import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { auth } from '../better-auth.config';

export interface AppBindings {
  Bindings: Env;
}

export interface AppVariables {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings & AppVariables
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
