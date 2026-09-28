import { ApiError, errorMessage, isNetworkError } from '../errors';

describe('errorMessage', () => {
  it('ApiError 코드별로 사용자 문구를 돌려준다', () => {
    expect(errorMessage(new ApiError('CONFLICT'))).toMatch(/이미 다른 신청이 승인/);
    expect(errorMessage(new ApiError('DUPLICATE_PENDING'))).toMatch(/이미 대기 중인 신청/);
    expect(errorMessage(new ApiError('ALREADY_PROCESSED'))).toMatch(/이미 처리된/);
    expect(errorMessage(new ApiError('NETWORK'))).toMatch(/네트워크/);
    expect(errorMessage(new ApiError('CONFIRM_EMAIL'))).toMatch(/확인 메일/);
  });

  it('알 수 없는 오류는 일반 문구', () => {
    expect(errorMessage(new Error('boom'))).toBe('알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.');
    expect(errorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.');
  });
});

describe('isNetworkError', () => {
  it('NETWORK 코드이거나 fetch 실패(TypeError)면 true', () => {
    expect(isNetworkError(new ApiError('NETWORK'))).toBe(true);
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    expect(isNetworkError(new ApiError('CONFLICT'))).toBe(false);
  });
});
