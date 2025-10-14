import type { Context } from 'hono';
import type { AppBindings, AppVariables } from '../../lib/types';

export const generalRateLimiter = async (
  c: Context<AppVariables & AppBindings>,
  next: any,
) => {
  const ip = c.req.header('cf-connecting-ip') || '';
  const userId = c.get('user')?.id;
  const { success } = await c.env.GENERAL_RATE_LIMITER.limit({
    key: userId ?? ip,
  });

  if (!success) return c.newResponse(null, 429);
  await next();
};

export const downloadRateLimiter = async (
  c: Context<AppVariables & AppBindings>,
  next: any,
) => {
  const ip = c.req.header('cf-connecting-ip') || '';
  const userId = c.get('user')?.id;
  const { success } = await c.env.FILE_DOWNLOAD_RATE_LIMITER.limit({
    key: userId ?? ip,
  });

  if (!success) return c.newResponse(null, 429);
  await next();
};

export const uploadRateLimiter = async (
  c: Context<AppVariables & AppBindings>,
  next: any,
) => {
  const ip = c.req.header('cf-connecting-ip') || '';
  const userId = c.get('user')?.id;
  const { success } = await c.env.FILE_UPLOAD_RATE_LIMITER.limit({
    key: userId ?? ip,
  });

  if (!success) return c.newResponse(null, 429);
  await next();
};
