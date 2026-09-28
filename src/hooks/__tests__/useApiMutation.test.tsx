import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { ApiError } from '../../domain/errors';
import { useApiMutation } from '../queries';

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { invalidate, wrapper };
}

describe('useApiMutation', () => {
  it('성공하면 지정한 쿼리를 무효화한다', async () => {
    const { invalidate, wrapper } = setup();
    const { result } = await renderHook(
      () => useApiMutation((id: string) => Promise.resolve(id), [['requests'], ['items']]),
      { wrapper },
    );
    await act(() => result.current('r1'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['requests'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['items'] });
  });

  it('충돌로 실패해도 최신 상태를 다시 불러오고, 오류는 호출한 쪽으로 전달한다', async () => {
    const { invalidate, wrapper } = setup();
    const { result } = await renderHook(
      () => useApiMutation(() => Promise.reject(new ApiError('CONFLICT')), [['requests']]),
      { wrapper },
    );
    await act(async () => {
      await expect(result.current(undefined)).rejects.toMatchObject({ code: 'CONFLICT' });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['requests'] });
  });
});
