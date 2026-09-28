export type Role = 'member' | 'admin';
export type ItemStatus = 'available' | 'on_loan' | 'inactive';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LoanStatus = 'active' | 'return_requested' | 'returned';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  status: ItemStatus;
  /** 현재 사용자의 대기 신청이 있는지 */
  myPending: boolean;
}

export interface RentalRequest {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  dueDate: string;
  status: RequestStatus;
  rejectReason: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  requestId: string;
  dueDate: string;
  borrowedAt: string;
  returnRequestedAt: string | null;
  returnedAt: string | null;
  returnConfirmedBy: string | null;
  status: LoanStatus;
}
