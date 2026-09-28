import { ApiError, type ApiErrorCode } from '../domain/errors';

// RPC 함수가 raise exception '<CODE>'로 던지는 코드. 메시지가 이 중 하나면 그대로 쓴다.
const RAISED: ApiErrorCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_DATE',
  'PAST_DATE',
  'DUPLICATE_PENDING',
  'ITEM_UNAVAILABLE',
  'CONFLICT',
  'ALREADY_PROCESSED',
  'ITEM_ON_LOAN',
];

const BY_CODE: Record<string, ApiErrorCode> = {
  '42501': 'FORBIDDEN', // RLS 위반
  PGRST116: 'NOT_FOUND', // single()에 행 없음
  '22P02': 'NOT_FOUND', // uuid 형식 오류
  invalid_credentials: 'INVALID_CREDENTIALS',
  user_already_exists: 'EMAIL_TAKEN',
  email_exists: 'EMAIL_TAKEN',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TypeError) return new ApiError('NETWORK', error.message);

  const { message = '', code = '' } = (error ?? {}) as { message?: string; code?: string };
  if ((RAISED as string[]).includes(message)) return new ApiError(message as ApiErrorCode);
  if (BY_CODE[code]) return new ApiError(BY_CODE[code], message);
  if (/Failed to fetch|Network request failed/i.test(message)) return new ApiError('NETWORK', message);
  return new ApiError('UNKNOWN', message);
}
