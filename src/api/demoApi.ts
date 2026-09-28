// 데모(메모리) 백엔드. Supabase 없이 앱을 실행·시연하기 위한 구현으로,
// supabase/migrations 의 RLS·RPC 규칙과 같은 결과를 내도록 맞춘다. 새로고침하면 초기화된다.
import { addDays, todayInSeoul, validateDueDate } from '../domain/dueDate';
import { ApiError } from '../domain/errors';
import { deriveItemStatus } from '../domain/itemStatus';
import type { Item, Loan, Profile, RentalRequest } from '../domain/types';
import type { Api } from './types';

export const DEMO_PASSWORD = 'demo1234';
// 다른 신청 승인으로 자동 거절될 때의 사유. SQL(approve_request)과 같은 문자열이어야 한다.
export const AUTO_REJECT_REASON = '다른 신청이 승인되어 자동 거절되었습니다.';

type ItemRow = { id: string; name: string; description: string; isActive: boolean; createdAt: string };
type RequestRow = Omit<RentalRequest, 'itemName' | 'userName'>;
type LoanRow = Omit<Loan, 'itemName' | 'userName'>;
type UserRow = Profile & { password: string };

export interface DemoStore {
  users: UserRow[];
  items: ItemRow[];
  requests: RequestRow[];
  loans: LoanRow[];
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createDemoStore({ seed = true }: { seed?: boolean } = {}): DemoStore {
  const users: UserRow[] = [
    { id: uuid(), email: 'admin@billim.dev', displayName: '박관리', role: 'admin', password: DEMO_PASSWORD },
    { id: uuid(), email: 'member@billim.dev', displayName: '김회원', role: 'member', password: DEMO_PASSWORD },
    { id: uuid(), email: 'member2@billim.dev', displayName: '이회원', role: 'member', password: DEMO_PASSWORD },
  ];
  const store: DemoStore = { users, items: [], requests: [], loans: [] };
  if (seed) seedDemoData(store);
  return store;
}

function seedDemoData(store: DemoStore) {
  const [admin, member, member2] = store.users;
  const now = new Date();
  const today = todayInSeoul(now);
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
  // 시드 물품 id는 고정한다. 데모 데이터는 기기마다 따로 만들어지므로, 무작위 id면
  // PC 화면에 띄운 QR을 휴대폰(Expo Go)으로 스캔했을 때 '등록되지 않은 물품'이 된다.
  const item = (seq: number, name: string, description: string, isActive = true): ItemRow => {
    const id = `b1110000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
    const row = { id, name, description, isActive, createdAt: iso(30) };
    store.items.push(row);
    return row;
  };

  const projector = item(1, '빔 프로젝터', '회의실용 FHD 프로젝터. HDMI 케이블 포함.');
  item(2, '노트북 거치대', '알루미늄 접이식 거치대.');
  const game = item(3, '보드게임 스플렌더', '2~4인. 카드 누락 없는지 반납 시 확인.');
  const tripod = item(4, '카메라 삼각대', '최대 160cm. 스마트폰 홀더 포함.');
  item(5, '무선 마이크 세트', '마이크 2개와 수신기. 건전지는 AA.');
  item(6, '멀티탭 5구', '전선 피복 손상으로 점검 중.', false);

  // 이회원이 삼각대를 대여 중(기한 경과), 보드게임은 반납 요청 중
  const tripodReq: RequestRow = {
    id: uuid(), itemId: tripod.id, userId: member2.id, dueDate: addDays(today, -1), status: 'approved',
    rejectReason: null, processedBy: admin.id, processedAt: iso(5), createdAt: iso(6),
  };
  const gameReq: RequestRow = {
    id: uuid(), itemId: game.id, userId: member.id, dueDate: addDays(today, 3), status: 'approved',
    rejectReason: null, processedBy: admin.id, processedAt: iso(2), createdAt: iso(2),
  };
  store.requests.push(tripodReq, gameReq);
  store.loans.push(
    {
      id: uuid(), itemId: tripod.id, userId: member2.id, requestId: tripodReq.id, dueDate: tripodReq.dueDate,
      borrowedAt: iso(5), returnRequestedAt: null, returnedAt: null, returnConfirmedBy: null, status: 'active',
    },
    {
      id: uuid(), itemId: game.id, userId: member.id, requestId: gameReq.id, dueDate: gameReq.dueDate,
      borrowedAt: iso(2), returnRequestedAt: iso(0), returnedAt: null, returnConfirmedBy: null,
      status: 'return_requested',
    },
  );

  // 빔 프로젝터에 두 회원의 대기 신청(승인 충돌 시연용)
  store.requests.push(
    {
      id: uuid(), itemId: projector.id, userId: member2.id, dueDate: addDays(today, 2), status: 'pending',
      rejectReason: null, processedBy: null, processedAt: null, createdAt: iso(1),
    },
    {
      id: uuid(), itemId: projector.id, userId: member.id, dueDate: addDays(today, 4), status: 'pending',
      rejectReason: null, processedBy: null, processedAt: null, createdAt: iso(0),
    },
  );
}

export function createDemoApi(
  store: DemoStore,
  { now = () => new Date(), latencyMs = 0 }: { now?: () => Date; latencyMs?: number } = {},
): Api {
  let currentUserId: string | null = null;

  // 네트워크 지연을 흉내 낸다. 지연 뒤의 검사·변경은 한 번에(동기로) 처리되어 서버 트랜잭션처럼 원자적이다.
  const delay = () => new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

  function me(): UserRow {
    const user = store.users.find((u) => u.id === currentUserId);
    if (!user) throw new ApiError('UNAUTHENTICATED');
    return user;
  }
  function requireAdmin(): UserRow {
    const user = me();
    if (user.role !== 'admin') throw new ApiError('FORBIDDEN');
    return user;
  }
  const profile = ({ password: _password, ...p }: UserRow): Profile => p;
  const userName = (id: string) => store.users.find((u) => u.id === id)?.displayName ?? '(알 수 없음)';
  const itemName = (id: string) => store.items.find((i) => i.id === id)?.name ?? '(삭제된 물품)';
  const openLoanOf = (itemId: string) =>
    store.loans.find((l) => l.itemId === itemId && l.status !== 'returned');

  function toItem(row: ItemRow, viewerId: string): Item {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      status: deriveItemStatus(row, store.loans.filter((l) => l.itemId === row.id)),
      myPending: store.requests.some(
        (r) => r.itemId === row.id && r.userId === viewerId && r.status === 'pending',
      ),
    };
  }
  const toRequest = (r: RequestRow): RentalRequest => ({
    ...r,
    itemName: itemName(r.itemId),
    userName: userName(r.userId),
  });
  const toLoan = (l: LoanRow): Loan => ({ ...l, itemName: itemName(l.itemId), userName: userName(l.userId) });
  const newest = <T extends { createdAt?: string; borrowedAt?: string }>(a: T, b: T) =>
    (b.createdAt ?? b.borrowedAt ?? '').localeCompare(a.createdAt ?? a.borrowedAt ?? '');

  function findItem(id: string): ItemRow {
    const row = store.items.find((i) => i.id === id);
    if (!row) throw new ApiError('NOT_FOUND');
    return row;
  }
  function findRequest(id: string): RequestRow {
    const row = store.requests.find((r) => r.id === id);
    if (!row) throw new ApiError('NOT_FOUND');
    return row;
  }
  function findLoan(id: string): LoanRow {
    const row = store.loans.find((l) => l.id === id);
    if (!row) throw new ApiError('NOT_FOUND');
    return row;
  }

  return {
    async getSession() {
      await delay();
      const user = store.users.find((u) => u.id === currentUserId);
      return user ? profile(user) : null;
    },
    async signIn(email, password) {
      await delay();
      const user = store.users.find((u) => u.email === email.trim().toLowerCase());
      if (!user || user.password !== password) throw new ApiError('INVALID_CREDENTIALS');
      currentUserId = user.id;
      return profile(user);
    },
    async signUp(email, password, displayName) {
      await delay();
      const normalized = email.trim().toLowerCase();
      if (store.users.some((u) => u.email === normalized)) throw new ApiError('EMAIL_TAKEN');
      const user: UserRow = { id: uuid(), email: normalized, displayName, role: 'member', password };
      store.users.push(user);
      currentUserId = user.id;
      return profile(user);
    },
    async signOut() {
      await delay();
      currentUserId = null;
    },
    async resetPassword() {
      await delay(); // 데모에서는 메일을 보내지 않는다.
    },

    async listItems({ query, status } = {}) {
      await delay();
      const user = me();
      const q = query?.trim().toLowerCase() ?? '';
      return store.items
        .filter((row) => row.name.toLowerCase().includes(q))
        .map((row) => toItem(row, user.id))
        .filter((item) => !status || item.status === status)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    },
    async getItem(id) {
      await delay();
      const user = me();
      return toItem(findItem(id), user.id);
    },
    async createItem({ name, description }) {
      await delay();
      const user = requireAdmin();
      const row: ItemRow = { id: uuid(), name, description, isActive: true, createdAt: now().toISOString() };
      store.items.push(row);
      return toItem(row, user.id);
    },
    async updateItem(id, input) {
      await delay();
      const user = requireAdmin();
      const row = findItem(id);
      if (input.isActive === false && openLoanOf(id)) throw new ApiError('ITEM_ON_LOAN');
      Object.assign(row, input);
      return toItem(row, user.id);
    },

    async createRequest(itemId, dueDate) {
      await delay();
      const user = me();
      const row = findItem(itemId);
      const check = validateDueDate(dueDate, todayInSeoul(now()));
      if (!check.ok) throw new ApiError(check.reason === 'past' ? 'PAST_DATE' : 'INVALID_DATE');
      if (!row.isActive || openLoanOf(itemId)) throw new ApiError('ITEM_UNAVAILABLE');
      if (store.requests.some((r) => r.itemId === itemId && r.userId === user.id && r.status === 'pending')) {
        throw new ApiError('DUPLICATE_PENDING');
      }
      const request: RequestRow = {
        id: uuid(), itemId, userId: user.id, dueDate, status: 'pending', rejectReason: null,
        processedBy: null, processedAt: null, createdAt: now().toISOString(),
      };
      store.requests.push(request);
      return toRequest(request);
    },
    async cancelRequest(requestId) {
      await delay();
      const user = me();
      const request = findRequest(requestId);
      if (request.userId !== user.id) throw new ApiError('FORBIDDEN');
      if (request.status !== 'pending') throw new ApiError('ALREADY_PROCESSED');
      request.status = 'cancelled';
      request.processedAt = now().toISOString();
    },
    async approveRequest(requestId) {
      await delay();
      const admin = requireAdmin();
      const request = findRequest(requestId);
      if (request.status !== 'pending') {
        // 동시 승인에서 진 쪽(자동 거절됨)만 CONFLICT. 그 밖의 처리된 신청은 ALREADY_PROCESSED.
        const lostRace = request.status === 'rejected' && request.rejectReason === AUTO_REJECT_REASON;
        throw new ApiError(lostRace ? 'CONFLICT' : 'ALREADY_PROCESSED');
      }
      if (openLoanOf(request.itemId)) throw new ApiError('CONFLICT');

      const at = now().toISOString();
      request.status = 'approved';
      request.processedBy = admin.id;
      request.processedAt = at;
      for (const other of store.requests) {
        if (other.itemId === request.itemId && other.status === 'pending') {
          other.status = 'rejected';
          other.rejectReason = AUTO_REJECT_REASON;
          other.processedBy = admin.id;
          other.processedAt = at;
        }
      }
      const loan: LoanRow = {
        id: uuid(), itemId: request.itemId, userId: request.userId, requestId: request.id,
        dueDate: request.dueDate, borrowedAt: at, returnRequestedAt: null, returnedAt: null,
        returnConfirmedBy: null, status: 'active',
      };
      store.loans.push(loan);
      return toLoan(loan);
    },
    async rejectRequest(requestId, reason) {
      await delay();
      const admin = requireAdmin();
      const request = findRequest(requestId);
      if (request.status !== 'pending') throw new ApiError('ALREADY_PROCESSED');
      request.status = 'rejected';
      request.rejectReason = reason.trim() || null;
      request.processedBy = admin.id;
      request.processedAt = now().toISOString();
    },
    async listMyRequests() {
      await delay();
      const user = me();
      return store.requests.filter((r) => r.userId === user.id).map(toRequest).sort(newest);
    },
    async listAllRequests() {
      await delay();
      requireAdmin();
      return store.requests.map(toRequest).sort(newest);
    },

    async listMyLoans() {
      await delay();
      const user = me();
      return store.loans.filter((l) => l.userId === user.id).map(toLoan).sort(newest);
    },
    async listAllLoans() {
      await delay();
      requireAdmin();
      return store.loans.map(toLoan).sort(newest);
    },
    async requestReturn(loanId) {
      await delay();
      const user = me();
      const loan = findLoan(loanId);
      if (loan.userId !== user.id) throw new ApiError('FORBIDDEN');
      if (loan.status !== 'active') throw new ApiError('ALREADY_PROCESSED');
      loan.status = 'return_requested';
      loan.returnRequestedAt = now().toISOString();
    },
    async confirmReturn(loanId) {
      await delay();
      const admin = requireAdmin();
      const loan = findLoan(loanId);
      if (loan.status !== 'return_requested') throw new ApiError('ALREADY_PROCESSED');
      loan.status = 'returned';
      loan.returnedAt = now().toISOString();
      loan.returnConfirmedBy = admin.id;
    },
  };
}
