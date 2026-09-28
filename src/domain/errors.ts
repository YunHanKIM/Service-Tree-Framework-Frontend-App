export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'CONFIRM_EMAIL'
  | 'NOT_FOUND'
  | 'INVALID_DATE'
  | 'PAST_DATE'
  | 'DUPLICATE_PENDING'
  | 'ITEM_UNAVAILABLE'
  | 'CONFLICT'
  | 'ALREADY_PROCESSED'
  | 'ITEM_ON_LOAN'
  | 'NETWORK'
  | 'UNKNOWN';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

const MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHENTICATED: '로그인이 필요합니다.',
  FORBIDDEN: '이 작업을 할 권한이 없습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  EMAIL_TAKEN: '이미 가입된 이메일입니다.',
  CONFIRM_EMAIL: '가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.',
  NOT_FOUND: '등록되지 않은 물품입니다.',
  INVALID_DATE: '반납 예정일 형식이 올바르지 않습니다.',
  PAST_DATE: '반납 예정일은 오늘 이후여야 합니다.',
  DUPLICATE_PENDING: '이 물품에 이미 대기 중인 신청이 있습니다.',
  ITEM_UNAVAILABLE: '지금은 대여할 수 없는 물품입니다.',
  CONFLICT: '이미 다른 신청이 승인되어 처리할 수 없습니다. 목록을 새로 불러왔습니다.',
  ALREADY_PROCESSED: '이미 처리된 요청입니다. 최신 상태를 불러왔습니다.',
  ITEM_ON_LOAN: '대여 중인 물품은 사용 중지할 수 없습니다.',
  NETWORK: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.',
};

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) return error.code === 'NETWORK';
  return error instanceof TypeError;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code];
  if (isNetworkError(error)) return MESSAGES.NETWORK;
  return MESSAGES.UNKNOWN;
}
