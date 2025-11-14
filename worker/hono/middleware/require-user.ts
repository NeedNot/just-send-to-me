export const requireUser = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || user.deletingAt) return c.body(null, 401);
  await next();
};
