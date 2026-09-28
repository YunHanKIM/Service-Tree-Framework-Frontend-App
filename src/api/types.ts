import type { Item, ItemStatus, Loan, Profile, RentalRequest } from '../domain/types';

/**
 * 앱이 서버와 주고받는 계약. 데모(메모리) 구현과 Supabase 구현이 같은 규칙을 지킨다.
 * 실패는 모두 ApiError(code)로 던진다.
 */
export interface Api {
  getSession(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<Profile>;
  signUp(email: string, password: string, displayName: string): Promise<Profile>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;

  listItems(params?: { query?: string; status?: ItemStatus }): Promise<Item[]>;
  getItem(id: string): Promise<Item>;
  createItem(input: { name: string; description: string }): Promise<Item>;
  updateItem(
    id: string,
    input: { name?: string; description?: string; isActive?: boolean },
  ): Promise<Item>;

  createRequest(itemId: string, dueDate: string): Promise<RentalRequest>;
  cancelRequest(requestId: string): Promise<void>;
  approveRequest(requestId: string): Promise<Loan>;
  rejectRequest(requestId: string, reason: string): Promise<void>;
  listMyRequests(): Promise<RentalRequest[]>;
  listAllRequests(): Promise<RentalRequest[]>;

  listMyLoans(): Promise<Loan[]>;
  listAllLoans(): Promise<Loan[]>;
  requestReturn(loanId: string): Promise<void>;
  confirmReturn(loanId: string): Promise<void>;
}
