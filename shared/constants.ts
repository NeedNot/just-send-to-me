import type { ExpirationDuration } from './schemas';

export const MS_IN_DAY = 1000 * 60 * 60 * 24;
export const MS_IN_HOUR = 1000 * 60 * 60;

export const expirationDurations: Record<ExpirationDuration, number> = {
  '1d': MS_IN_DAY * 1,
  '3d': MS_IN_DAY * 3,
  '7d': MS_IN_DAY * 7,
};
