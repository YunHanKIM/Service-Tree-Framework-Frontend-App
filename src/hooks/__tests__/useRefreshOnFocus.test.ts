import { renderHook } from '@testing-library/react-native';
import { useRefreshOnFocus } from '../useRefreshOnFocus';

// 화면 포커스를 테스트에서 직접 일으킨다.
let focus: () => void = () => {};
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    focus = effect;
    effect(); // 처음 마운트될 때도 포커스가 한 번 일어난다
  },
}));

describe('useRefreshOnFocus', () => {
  it('처음 화면에 들어올 때는 다시 조회하지 않고(이미 조회 중), 다시 돌아올 때마다 조회한다', async () => {
    const refetch = jest.fn(() => Promise.resolve());
    await renderHook(() => useRefreshOnFocus(refetch));
    expect(refetch).not.toHaveBeenCalled();

    focus();
    focus();
    expect(refetch).toHaveBeenCalledTimes(2);
  });
});
