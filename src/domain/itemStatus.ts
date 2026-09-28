import type { ItemStatus, LoanStatus } from './types';

export function deriveItemStatus(
  item: { isActive: boolean },
  loans: { status: LoanStatus }[],
): ItemStatus {
  if (!item.isActive) return 'inactive';
  if (loans.some((l) => l.status !== 'returned')) return 'on_loan';
  return 'available';
}

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  available: '대여 가능',
  on_loan: '대여 중',
  inactive: '사용 중지',
};
