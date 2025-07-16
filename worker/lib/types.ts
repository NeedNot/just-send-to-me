import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';

export interface AppBindings {
  Bindings: {
    DB: D1Database;
  };
}

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
