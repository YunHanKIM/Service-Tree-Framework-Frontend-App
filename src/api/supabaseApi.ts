// Supabase 구현. 조회는 뷰 select(RLS 적용), 상태 변경은 RPC 함수(supabase/migrations/0001_init.sql).
// 주의: 실제 Supabase 프로젝트에 연결해 검증하지 않았다(docs/ai/12_known_issues).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../domain/errors';
import type { Item, Loan, Profile, RentalRequest } from '../domain/types';
import { toApiError } from './supabaseErrors';
import type { Api } from './types';

type Row = Record<string, any>;

const toProfile = (r: Row): Profile => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name,
  role: r.role,
});
const toItem = (r: Row): Item => ({
  id: r.id,
  name: r.name,
  description: r.description,
  isActive: r.is_active,
  status: r.status,
  myPending: r.my_pending,
});
const toRequest = (r: Row): RentalRequest => ({
  id: r.id,
  itemId: r.item_id,
  itemName: r.item_name,
  userId: r.user_id,
  userName: r.user_name,
  dueDate: r.due_date,
  status: r.status,
  rejectReason: r.reject_reason,
  processedBy: r.processed_by,
  processedAt: r.processed_at,
  createdAt: r.created_at,
});
const toLoan = (r: Row): Loan => ({
  id: r.id,
  itemId: r.item_id,
  itemName: r.item_name,
  userId: r.user_id,
  userName: r.user_name,
  requestId: r.request_id,
  dueDate: r.due_date,
  borrowedAt: r.borrowed_at,
  returnRequestedAt: r.return_requested_at,
  returnedAt: r.returned_at,
  returnConfirmedBy: r.return_confirmed_by,
  status: r.status,
});

// ilike 패턴의 와일드카드를 이스케이프한다.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export function createSupabaseApi(url: string, anonKey: string): Api {
  const db: SupabaseClient = createClient(url, anonKey, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  // 오류는 ApiError로 바꿔 던지고, 성공하면 data를 돌려준다. 행은 스키마 타입 없이 Row로 다룬다.
  async function run(promise: PromiseLike<{ data?: any; error: unknown }>): Promise<any> {
    let result: { data?: any; error: unknown };
    try {
      result = await promise;
    } catch (e) {
      throw toApiError(e);
    }
    if (result.error) throw toApiError(result.error);
    return result.data;
  }

  async function me(): Promise<Profile> {
    const { data } = await db.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) throw new ApiError('UNAUTHENTICATED');
    return toProfile(await run(db.from('profiles').select('*').eq('id', userId).single()));
  }
  async function requireAdmin(): Promise<Profile> {
    const profile = await me();
    if (profile.role !== 'admin') throw new ApiError('FORBIDDEN');
    return profile;
  }

  const api: Api = {
    async getSession() {
      const { data } = await db.auth.getSession();
      return data.session ? me() : null;
    },
    async signIn(email, password) {
      await run(db.auth.signInWithPassword({ email: email.trim(), password }));
      return me();
    },
    async signUp(email, password, displayName) {
      const data = await run(
        db.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName } } }),
      );
      // 이메일 확인을 켠 프로젝트는 세션 없이 돌아온다.
      if (!data.session) throw new ApiError('CONFIRM_EMAIL');
      return me();
    },
    async signOut() {
      await run(db.auth.signOut());
    },
    async resetPassword(email) {
      await run(db.auth.resetPasswordForEmail(email.trim()));
    },

    async listItems({ query, status } = {}) {
      await me();
      let q = db.from('item_view').select('*').order('name');
      if (query?.trim()) q = q.ilike('name', `%${likeEscape(query.trim())}%`);
      if (status) q = q.eq('status', status);
      return (await run(q)).map(toItem);
    },
    async getItem(id) {
      const [row] = await run(db.from('item_view').select('*').eq('id', id));
      if (!row) throw new ApiError('NOT_FOUND');
      return toItem(row);
    },
    async createItem({ name, description }) {
      await requireAdmin();
      const row = await run(db.from('items').insert({ name, description }).select('id').single());
      return api.getItem(row.id);
    },
    async updateItem(id, input) {
      await requireAdmin();
      const patch: Row = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.isActive !== undefined) patch.is_active = input.isActive;
      await run(db.from('items').update(patch).eq('id', id).select('id').single());
      return api.getItem(id);
    },

    async createRequest(itemId, dueDate) {
      const id = await run(db.rpc('create_request', { p_item_id: itemId, p_due_date: dueDate }));
      return toRequest(await run(db.from('request_view').select('*').eq('id', id).single()));
    },
    async cancelRequest(requestId) {
      await run(db.rpc('cancel_request', { p_request_id: requestId }));
    },
    async approveRequest(requestId) {
      const id = await run(db.rpc('approve_request', { p_request_id: requestId }));
      return toLoan(await run(db.from('loan_view').select('*').eq('id', id).single()));
    },
    async rejectRequest(requestId, reason) {
      await run(db.rpc('reject_request', { p_request_id: requestId, p_reason: reason }));
    },
    async listMyRequests() {
      const user = await me();
      const rows = await run(
        db.from('request_view').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      );
      return rows.map(toRequest);
    },
    async listAllRequests() {
      await requireAdmin();
      const rows = await run(db.from('request_view').select('*').order('created_at', { ascending: false }));
      return rows.map(toRequest);
    },

    async listMyLoans() {
      const user = await me();
      const rows = await run(
        db.from('loan_view').select('*').eq('user_id', user.id).order('borrowed_at', { ascending: false }),
      );
      return rows.map(toLoan);
    },
    async listAllLoans() {
      await requireAdmin();
      const rows = await run(db.from('loan_view').select('*').order('borrowed_at', { ascending: false }));
      return rows.map(toLoan);
    },
    async requestReturn(loanId) {
      await run(db.rpc('request_return', { p_loan_id: loanId }));
    },
    async confirmReturn(loanId) {
      await run(db.rpc('confirm_return', { p_loan_id: loanId }));
    },
  };
  return api;
}
