/**
 * 실제 Supabase 프로젝트에 대한 통합 테스트(jest.integration.config.js — jest-expo가 fetch를 스텁으로 바꾸므로 별도 설정). demoApi.test.ts와 같은 규칙을 서버(RLS·RPC)가 지키는지 확인한다.
 * 환경변수가 모두 있어야 실행한다(없으면 건너뜀, 일반 `npm test`에는 포함되지 않음).
 *   SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY — 데모 계정 3개(admin/member/member2@billim.dev, demo1234)가 있어야 한다
 *   SUPABASE_TEST_DB_URL — 정리용 DB 접속 문자열(Session pooler). 앱 RLS에는 삭제 정책이 없으므로
 *                          테스트가 만든 데이터는 이 관리 채널로만 지운다. 정리 경로 없이 실DB를 오염시키지 않도록 필수.
 * 실행: npm run test:supabase
 */
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import { addDays, todayInSeoul } from '../../domain/dueDate';
import { createSupabaseApi } from '../supabaseApi';

const URL = process.env.SUPABASE_TEST_URL;
const KEY = process.env.SUPABASE_TEST_ANON_KEY;
const DB_URL = process.env.SUPABASE_TEST_DB_URL;
const PASSWORD = 'demo1234';
const run = URL && KEY && DB_URL ? describe : describe.skip;
// 이번 실행이 만든 물품만 지우기 위한 표식
const RUN_TAG = `[테스트:${Date.now().toString(36)}]`;

jest.setTimeout(30_000);

run('Supabase 통합', () => {
  const today = todayInSeoul();
  let seq = 0;
  const api = (who: string) => createSupabaseApi(URL!, KEY!, { storageKey: `it-${who}-${Date.now()}-${seq++}` });
  const admin = api('admin');
  const member = api('member');
  const member2 = api('member2');
  const newItem = (label: string) => admin.createItem({ name: `${RUN_TAG} ${label}`, description: '통합 테스트' });

  beforeAll(async () => {
    await admin.signIn('admin@billim.dev', PASSWORD);
    await member.signIn('member@billim.dev', PASSWORD);
    await member2.signIn('member2@billim.dev', PASSWORD);
  });

  afterAll(async () => {
    const db = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    await db.connect();
    try {
      const tagged = `select id from public.items where name like $1`;
      const like = `${RUN_TAG}%`;
      await db.query('begin');
      await db.query(`delete from public.loans where item_id in (${tagged})`, [like]);
      await db.query(`delete from public.requests where item_id in (${tagged})`, [like]);
      await db.query(`delete from public.items where name like $1`, [like]);
      await db.query('commit');
    } finally {
      await db.end();
    }
  });

  it('틀린 비밀번호는 INVALID_CREDENTIALS', async () => {
    await expect(api('x').signIn('member@billim.dev', 'wrong')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('시드 물품은 데모와 같은 고정 id로 조회된다', async () => {
    await expect(member.getItem('b1110000-0000-4000-8000-000000000001')).resolves.toMatchObject({
      name: '빔 프로젝터',
    });
    await expect(member.getItem('00000000-0000-4000-8000-000000000999')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('회원은 자기 역할을 관리자로 바꿀 수 없다(RLS·컬럼 권한)', async () => {
    const raw = createClient(URL!, KEY!, { auth: { persistSession: false } });
    const { data } = await raw.auth.signInWithPassword({ email: 'member@billim.dev', password: PASSWORD });
    const { error } = await raw.from('profiles').update({ role: 'admin' }).eq('id', data.user!.id);
    expect(error).not.toBeNull();
    expect((await member.getSession())?.role).toBe('member');
  });

  it('회원은 물품을 만들 수 없다(직접 insert도 RLS가 거부)', async () => {
    await expect(member.createItem({ name: 'x', description: '' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const raw = createClient(URL!, KEY!, { auth: { persistSession: false } });
    await raw.auth.signInWithPassword({ email: 'member@billim.dev', password: PASSWORD });
    const { error } = await raw.from('items').insert({ name: `${RUN_TAG} 무단 등록` });
    expect(error).not.toBeNull();
  });

  it('신청 검증: 과거·잘못된 날짜, 중복 대기 신청', async () => {
    const item = await newItem('검증');
    await expect(member.createRequest(item.id, addDays(today, -1))).rejects.toMatchObject({ code: 'PAST_DATE' });
    await expect(member.createRequest(item.id, '2026-13-01')).rejects.toMatchObject({ code: 'INVALID_DATE' });
    await member.createRequest(item.id, today);
    await expect(member.createRequest(item.id, today)).rejects.toMatchObject({ code: 'DUPLICATE_PENDING' });
    expect((await member.getItem(item.id)).myPending).toBe(true);
    expect((await member2.getItem(item.id)).myPending).toBe(false);
  });

  it('회원은 다른 회원의 신청을 볼 수 없다(직접 select도 RLS로 걸러짐)', async () => {
    const item = await newItem('가시성');
    const req = await member.createRequest(item.id, today);
    expect((await member2.listMyRequests()).some((r) => r.id === req.id)).toBe(false);
    await expect(member2.listAllRequests()).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const raw = createClient(URL!, KEY!, { auth: { persistSession: false } });
    await raw.auth.signInWithPassword({ email: 'member2@billim.dev', password: PASSWORD });
    const { data } = await raw.from('requests').select('id').eq('id', req.id);
    expect(data).toEqual([]);
  });

  it('승인하면 대여가 생기고, 다른 대기 신청은 자동 거절, 재승인은 ALREADY_PROCESSED', async () => {
    const item = await newItem('승인');
    const a = await member.createRequest(item.id, addDays(today, 2));
    const b = await member2.createRequest(item.id, addDays(today, 3));

    const loan = await admin.approveRequest(a.id);
    expect(loan).toMatchObject({ itemId: item.id, status: 'active', dueDate: addDays(today, 2) });
    // 다른 회원의 대여도 물품 상태에는 반영된다(item_has_open_loan은 definer 함수)
    expect((await member2.getItem(item.id)).status).toBe('on_loan');

    const bAfter = (await member2.listMyRequests()).find((r) => r.id === b.id)!;
    expect(bAfter.status).toBe('rejected');
    await expect(admin.approveRequest(a.id)).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
    await expect(admin.approveRequest(b.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(member2.createRequest(item.id, today)).rejects.toMatchObject({ code: 'ITEM_UNAVAILABLE' });
  });

  it('두 관리자가 동시에 승인해도 대여는 한 건만 확정된다', async () => {
    const item = await newItem('동시 승인');
    const a = await member.createRequest(item.id, today);
    const b = await member2.createRequest(item.id, today);
    const adminB = api('adminB');
    await adminB.signIn('admin@billim.dev', PASSWORD);

    const results = await Promise.allSettled([admin.approveRequest(a.id), adminB.approveRequest(b.id)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const lost = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(lost.reason).toMatchObject({ code: 'CONFLICT' });

    const open = (await admin.listAllLoans()).filter((l) => l.itemId === item.id && l.status !== 'returned');
    expect(open).toHaveLength(1);
  });

  it('반납: 본인만 요청, 관리자만 확인, 요청 전 확인 불가, 대여 중 사용 중지 불가', async () => {
    const item = await newItem('반납');
    const loan = await admin.approveRequest((await member.createRequest(item.id, today)).id);

    await expect(admin.updateItem(item.id, { isActive: false })).rejects.toMatchObject({ code: 'ITEM_ON_LOAN' });
    await expect(admin.confirmReturn(loan.id)).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
    await expect(member2.requestReturn(loan.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });

    await member.requestReturn(loan.id);
    await expect(member.confirmReturn(loan.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await member.getItem(item.id)).status).toBe('on_loan');

    await admin.confirmReturn(loan.id);
    expect((await member.getItem(item.id)).status).toBe('available');
    await admin.updateItem(item.id, { isActive: false });
    expect((await member.getItem(item.id)).status).toBe('inactive');
  });

  it('취소: 본인 대기 신청만, 처리된 신청은 ALREADY_PROCESSED', async () => {
    const item = await newItem('취소');
    const req = await member.createRequest(item.id, today);
    await expect(member2.cancelRequest(req.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await member.cancelRequest(req.id);
    await expect(member.cancelRequest(req.id)).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
    await expect(admin.approveRequest(req.id)).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });
  });
});
