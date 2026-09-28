import { ITEM_STATUS_LABEL } from '../domain/itemStatus';
import type { ItemStatus, LoanStatus, RequestStatus } from '../domain/types';
import type { Tone } from './StatusBadge';

export const itemBadge = (s: ItemStatus): { label: string; tone: Tone } => ({
  label: ITEM_STATUS_LABEL[s],
  tone: s === 'available' ? 'success' : s === 'on_loan' ? 'warning' : 'muted',
});

const REQUEST: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: '승인 대기', tone: 'info' },
  approved: { label: '승인됨', tone: 'success' },
  rejected: { label: '거절됨', tone: 'danger' },
  cancelled: { label: '취소함', tone: 'muted' },
};
export const requestBadge = (s: RequestStatus) => REQUEST[s];

const LOAN: Record<LoanStatus, { label: string; tone: Tone }> = {
  active: { label: '대여 중', tone: 'warning' },
  return_requested: { label: '반납 확인 대기', tone: 'info' },
  returned: { label: '반납 완료', tone: 'muted' },
};
export const loanBadge = (s: LoanStatus) => LOAN[s];

/** ISO 시각을 'YYYY-MM-DD HH:mm'(기기 시간대)로 짧게 보여준다. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
