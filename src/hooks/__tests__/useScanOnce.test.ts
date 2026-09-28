import { act, renderHook } from '@testing-library/react-native';
import { useScanOnce } from '../useScanOnce';

describe('useScanOnce', () => {
  it('같은 값이 연속으로 들어와도 콜백은 한 번만 호출된다', async () => {
    const onScan = jest.fn();
    const { result } = await renderHook(() => useScanOnce(onScan));

    await act(async () => {
      result.current.handle('billim://item/a');
      result.current.handle('billim://item/a');
      result.current.handle('billim://item/b');
    });

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('billim://item/a');
    expect(result.current.locked).toBe(true);
  });

  it('reset 후에는 다시 스캔할 수 있다', async () => {
    const onScan = jest.fn();
    const { result } = await renderHook(() => useScanOnce(onScan));

    await act(async () => result.current.handle('x'));
    await act(async () => result.current.reset());
    await act(async () => result.current.handle('x'));

    expect(onScan).toHaveBeenCalledTimes(2);
  });
});
