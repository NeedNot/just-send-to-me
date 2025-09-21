export const requireUser = async (c: any, next: any) => {
  if (!c.get('user')) return c.body(null, 401);
  await next();
};
