import { renderHook } from '@testing-library/react-native';
import { useRefreshOnFocus } from '../useRefreshOnFocus';

// 화면 포커스를 테스트에서 직접 일으킨다. 실제 useFocusEffect처럼 포커스된 상태에서는
// 콜백이 바뀔 때만 다시 실행한다(처음 마운트도 한 번 실행).
let mockFocus: () => void = () => {};
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    if (effect !== mockFocus) {
      mockFocus = effect;
      effect();
    }
  },
}));

beforeEach(() => {
  mockFocus = () => {};
});

describe('useRefreshOnFocus', () => {
  it('처음 화면에 들어올 때는 다시 조회하지 않고(이미 조회 중), 다시 돌아올 때마다 조회한다', async () => {
    const refetch = jest.fn(() => Promise.resolve());
    await renderHook(() => useRefreshOnFocus(refetch));
    expect(refetch).not.toHaveBeenCalled();

    mockFocus();
    mockFocus();
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('렌더마다 새 refetch 함수를 넘겨도 포커스 없이는 조회하지 않고, 포커스 시 최신 함수를 부른다', async () => {
    const calls: string[] = [];
    const { rerender } = await renderHook(({ tag }: { tag: string }) => useRefreshOnFocus(async () => void calls.push(tag)), {
      initialProps: { tag: 'v1' },
    });
    await rerender({ tag: 'v2' });
    await rerender({ tag: 'v3' });
    expect(calls).toEqual([]);

    mockFocus();
    expect(calls).toEqual(['v3']);
  });
});
