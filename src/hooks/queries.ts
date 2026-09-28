import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from '../api';
import type { ItemStatus } from '../domain/types';

export function useItems(params: { query?: string; status?: ItemStatus }) {
  return useQuery({ queryKey: ['items', params], queryFn: () => api.listItems(params) });
}

export function useItem(id: string) {
  return useQuery({ queryKey: ['item', id], queryFn: () => api.getItem(id) });
}

export function useMyRequests() {
  return useQuery({ queryKey: ['requests', 'mine'], queryFn: () => api.listMyRequests() });
}

export function useAllRequests() {
  return useQuery({ queryKey: ['requests', 'all'], queryFn: () => api.listAllRequests() });
}

export function useMyLoans() {
  return useQuery({ queryKey: ['loans', 'mine'], queryFn: () => api.listMyLoans() });
}

export function useAllLoans() {
  return useQuery({ queryKey: ['loans', 'all'], queryFn: () => api.listAllLoans() });
}

/** 상태 변경 후 영향받는 목록. 승인·반납은 물품 상태까지 바꾼다. */
export const AFFECTS = {
  request: [['requests'], ['items'], ['item']],
  loan: [['loans'], ['requests'], ['items'], ['item']],
  item: [['items'], ['item']],
} satisfies Record<string, QueryKey[]>;

/**
 * 서버 변경 요청. 낙관적 업데이트는 하지 않는다.
 * 성공·실패와 관계없이 관련 쿼리를 다시 불러온다 — 충돌(CONFLICT)·이미 처리됨이면 최신 상태를 보여줘야 하기 때문.
 * 돌려주는 함수는 실패하면 reject하므로 SubmitButton이 오류 문구를 보여준다.
 */
export function useApiMutation<V, R>(fn: (vars: V) => Promise<R>, invalidate: QueryKey[]) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
  return mutation.mutateAsync;
}
