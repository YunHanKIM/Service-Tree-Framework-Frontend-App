import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseApi } from '../supabaseApi';

describe('createSupabaseApi 세션 저장소', () => {
  afterEach(() => jest.restoreAllMocks());

  // Android의 AsyncStorage는 SQLite라서 키가 null/undefined면
  // "The bind value at index 1 is null"로 앱이 멈춘다(웹 localStorage는 'undefined' 문자열로 받아 줘서 드러나지 않음).
  it('storageKey를 주지 않으면 기본 키(문자열)로 세션을 읽는다', async () => {
    const getItem = jest.spyOn(AsyncStorage, 'getItem');
    const api = createSupabaseApi('https://abcdefgh.supabase.co', 'anon-key');

    await api.getSession();

    expect(getItem).toHaveBeenCalled();
    for (const [key] of getItem.mock.calls) {
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^sb-abcdefgh-auth-token/);
    }
  });

  it('storageKey를 주면 그 키를 쓴다', async () => {
    const getItem = jest.spyOn(AsyncStorage, 'getItem');
    const api = createSupabaseApi('https://abcdefgh.supabase.co', 'anon-key', { storageKey: 'custom-key' });

    await api.getSession();

    expect(getItem.mock.calls.map(([key]) => key)).toContain('custom-key');
  });
});
