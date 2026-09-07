// Re-exported here so existing imports keep working; the shapes live in api-types.
export type { ApiResult, RoundDetail } from './api-types';
import type { ApiResult } from './api-types';

export const isOffline = (result: ApiResult<unknown>): boolean => !result.ok && result.status === 0;
