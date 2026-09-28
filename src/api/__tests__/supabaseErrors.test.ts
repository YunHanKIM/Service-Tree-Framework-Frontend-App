import { ApiError } from '../../domain/errors';
import { toApiError } from '../supabaseErrors';

describe('toApiError', () => {
  it('RPC가 raise한 코드 문자열을 그대로 코드로 쓴다', () => {
    expect(toApiError({ message: 'CONFLICT', code: 'P0001' })).toMatchObject({ code: 'CONFLICT' });
    expect(toApiError({ message: 'PAST_DATE', code: 'P0001' })).toMatchObject({ code: 'PAST_DATE' });
  });

  it('RLS 위반(42501)은 FORBIDDEN', () => {
    expect(toApiError({ message: 'new row violates row-level security policy', code: '42501' })).toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('행 없음(PGRST116)과 잘못된 uuid(22P02)는 NOT_FOUND', () => {
    expect(toApiError({ message: 'x', code: 'PGRST116' })).toMatchObject({ code: 'NOT_FOUND' });
    expect(toApiError({ message: 'invalid input syntax for type uuid', code: '22P02' })).toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('인증 오류 코드를 바꾼다', () => {
    expect(toApiError({ message: 'Invalid login credentials', code: 'invalid_credentials' })).toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    expect(toApiError({ message: 'User already registered', code: 'user_already_exists' })).toMatchObject({
      code: 'EMAIL_TAKEN',
    });
  });

  it('fetch 실패는 NETWORK', () => {
    expect(toApiError(new TypeError('Network request failed'))).toMatchObject({ code: 'NETWORK' });
    expect(toApiError({ message: 'TypeError: Failed to fetch', code: '' })).toMatchObject({ code: 'NETWORK' });
  });

  it('이미 ApiError면 그대로, 모르는 오류는 UNKNOWN', () => {
    const original = new ApiError('CONFLICT');
    expect(toApiError(original)).toBe(original);
    expect(toApiError({ message: 'something odd', code: 'XX000' })).toMatchObject({ code: 'UNKNOWN' });
    expect(toApiError(null)).toBeInstanceOf(ApiError);
  });
});
