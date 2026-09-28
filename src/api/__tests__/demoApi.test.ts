import { ApiError } from '../../domain/errors';
import { createDemoApi, createDemoStore, DEMO_PASSWORD } from '../demoApi';

const NOW = () => new Date('2026-09-28T03:00:00Z'); // 서울 2026-09-28 12:00
const TODAY = '2026-09-28';

async function setup() {
  const store = createDemoStore({ seed: false });
  const admin = createDemoApi(store, { now: NOW });
  const member = createDemoApi(store, { now: NOW });
  const member2 = createDemoApi(store, { now: NOW });
  await admin.signIn('admin@billim.dev', DEMO_PASSWORD);
  await member.signIn('member@billim.dev', DEMO_PASSWORD);
  await member2.signIn('member2@billim.dev', DEMO_PASSWORD);
  const item = await admin.createItem({ name: '빔 프로젝터', description: '회의실용' });
  return { store, admin, member, member2, item };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe('인증', () => {
  it('비밀번호가 틀리면 INVALID_CREDENTIALS', async () => {
    const api = createDemoApi(createDemoStore({ seed: false }), { now: NOW });
    await expectCode(api.signIn('member@billim.dev', 'wrong'), 'INVALID_CREDENTIALS');
  });

  it('로그인하지 않으면 UNAUTHENTICATED', async () => {
    const api = createDemoApi(createDemoStore({ seed: false }), { now: NOW });
    await expectCode(api.listItems(), 'UNAUTHENTICATED');
  });

  it('가입하면 회원 역할이 자동 부여되고, 같은 이메일은 EMAIL_TAKEN', async () => {
    const store = createDemoStore({ seed: false });
    const api = createDemoApi(store, { now: NOW });
    const profile = await api.signUp('new@billim.dev', 'pw123456', '새회원');
    expect(profile.role).toBe('member');
    await expectCode(
      createDemoApi(store, { now: NOW }).signUp('new@billim.dev', 'x', 'x'),
      'EMAIL_TAKEN',
    );
  });

  it('로그아웃하면 세션이 없다', async () => {
    const { member } = await setup();
    await member.signOut();
    expect(await member.getSession()).toBeNull();
  });
});

describe('물품 조회', () => {
  it('이름 검색(대소문자 무시)과 상태 필터', async () => {
    const { admin, member } = await setup();
    await admin.createItem({ name: 'Nintendo Switch', description: '' });
    const off = await admin.createItem({ name: '멀티탭', description: '' });
    await admin.updateItem(off.id, { isActive: false });

    expect((await member.listItems({ query: 'switch' })).map((i) => i.name)).toEqual([
      'Nintendo Switch',
    ]);
    expect((await member.listItems({ status: 'inactive' })).map((i) => i.name)).toEqual(['멀티탭']);
  });

  it('없는 물품은 NOT_FOUND', async () => {
    const { member } = await setup();
    await expectCode(member.getItem('00000000-0000-4000-8000-000000000000'), 'NOT_FOUND');
  });

  it('본인 대기 신청이 있으면 myPending', async () => {
    const { member, member2, item } = await setup();
    await member.createRequest(item.id, TODAY);
    expect((await member.getItem(item.id)).myPending).toBe(true);
    expect((await member2.getItem(item.id)).myPending).toBe(false);
    // 대기 신청은 물품을 선점하지 않는다
    expect((await member2.getItem(item.id)).status).toBe('available');
  });
});

describe('대여 신청', () => {
  it('과거 날짜는 PAST_DATE, 잘못된 형식은 INVALID_DATE', async () => {
    const { member, item } = await setup();
    await expectCode(member.createRequest(item.id, '2026-09-27'), 'PAST_DATE');
    await expectCode(member.createRequest(item.id, '2026-13-01'), 'INVALID_DATE');
  });

  it('같은 물품에 대기 신청이 있으면 DUPLICATE_PENDING', async () => {
    const { member, item } = await setup();
    await member.createRequest(item.id, TODAY);
    await expectCode(member.createRequest(item.id, TODAY), 'DUPLICATE_PENDING');
  });

  it('대여 중이거나 사용 중지된 물품은 ITEM_UNAVAILABLE', async () => {
    const { admin, member, member2, item } = await setup();
    const req = await member.createRequest(item.id, TODAY);
    await admin.approveRequest(req.id);
    await expectCode(member2.createRequest(item.id, TODAY), 'ITEM_UNAVAILABLE');

    const off = await admin.createItem({ name: '멀티탭', description: '' });
    await admin.updateItem(off.id, { isActive: false });
    await expectCode(member2.createRequest(off.id, TODAY), 'ITEM_UNAVAILABLE');
  });
});

describe('승인과 거절', () => {
  it('회원은 승인할 수 없다', async () => {
    const { member, item } = await setup();
    const req = await member.createRequest(item.id, TODAY);
    await expectCode(member.approveRequest(req.id), 'FORBIDDEN');
  });

  it('승인하면 대여가 생기고 다른 대기 신청은 자동 거절된다', async () => {
    const { admin, member, member2, item } = await setup();
    const a = await member.createRequest(item.id, '2026-10-01');
    const b = await member2.createRequest(item.id, '2026-10-02');

    const loan = await admin.approveRequest(a.id);
    expect(loan).toMatchObject({ itemId: item.id, status: 'active', dueDate: '2026-10-01' });
    expect((await member.getItem(item.id)).status).toBe('on_loan');

    const [bAfter] = await member2.listMyRequests();
    expect(bAfter).toMatchObject({ id: b.id, status: 'rejected' });
    expect(bAfter.rejectReason).toMatch(/다른 신청/);

    const [aAfter] = await member.listMyRequests();
    expect(aAfter.processedBy).not.toBeNull();
    expect(aAfter.processedAt).not.toBeNull();
  });

  it('두 관리자가 동시에 승인해도 대여는 한 건만 확정되고 나머지는 CONFLICT', async () => {
    const { store, member, member2, item } = await setup();
    const a = await member.createRequest(item.id, TODAY);
    const b = await member2.createRequest(item.id, TODAY);

    const adminA = createDemoApi(store, { now: NOW, latencyMs: 5 });
    const adminB = createDemoApi(store, { now: NOW, latencyMs: 5 });
    await adminA.signIn('admin@billim.dev', DEMO_PASSWORD);
    await adminB.signIn('admin@billim.dev', DEMO_PASSWORD);

    const results = await Promise.allSettled([
      adminA.approveRequest(a.id),
      adminB.approveRequest(b.id),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: 'CONFLICT' });

    const active = (await adminA.listAllLoans()).filter((l) => l.status !== 'returned');
    expect(active).toHaveLength(1);
  });

  it('거절은 사유를 남기고, 처리된 신청을 다시 처리하면 ALREADY_PROCESSED', async () => {
    const { admin, member, item } = await setup();
    const req = await member.createRequest(item.id, TODAY);
    await admin.rejectRequest(req.id, '점검 예정');
    const [after] = await member.listMyRequests();
    expect(after).toMatchObject({ status: 'rejected', rejectReason: '점검 예정' });
    await expectCode(admin.rejectRequest(req.id, 'x'), 'ALREADY_PROCESSED');
  });
});

describe('신청 취소', () => {
  it('본인 대기 신청만 취소할 수 있다', async () => {
    const { admin, member, member2, item } = await setup();
    const req = await member.createRequest(item.id, TODAY);
    await expectCode(member2.cancelRequest(req.id), 'FORBIDDEN');
    await member.cancelRequest(req.id);
    expect((await member.listMyRequests())[0].status).toBe('cancelled');

    const req2 = await member.createRequest(item.id, TODAY);
    await admin.approveRequest(req2.id);
    await expectCode(member.cancelRequest(req2.id), 'ALREADY_PROCESSED');
  });
});

describe('반납', () => {
  it('반납 요청 중에도 대여 중이고, 관리자가 확인해야 대여 가능이 된다', async () => {
    const { admin, member, member2, item } = await setup();
    const req = await member.createRequest(item.id, TODAY);
    const loan = await admin.approveRequest(req.id);

    await expectCode(member2.requestReturn(loan.id), 'FORBIDDEN');
    await expectCode(member.confirmReturn(loan.id), 'FORBIDDEN');

    await member.requestReturn(loan.id);
    expect((await member.listMyLoans())[0].status).toBe('return_requested');
    expect((await member.getItem(item.id)).status).toBe('on_loan');

    await admin.confirmReturn(loan.id);
    const [done] = await member.listMyLoans();
    expect(done.status).toBe('returned');
    expect(done.returnConfirmedBy).not.toBeNull();
    expect((await member.getItem(item.id)).status).toBe('available');
  });

  it('반납 요청 전에는 반납 확인할 수 없다', async () => {
    const { admin, member, item } = await setup();
    const loan = await admin.approveRequest((await member.createRequest(item.id, TODAY)).id);
    await expectCode(admin.confirmReturn(loan.id), 'ALREADY_PROCESSED');
  });
});

describe('관리자 물품 관리', () => {
  it('대여 중인 물품은 사용 중지할 수 없다', async () => {
    const { admin, member, item } = await setup();
    await admin.approveRequest((await member.createRequest(item.id, TODAY)).id);
    await expectCode(admin.updateItem(item.id, { isActive: false }), 'ITEM_ON_LOAN');
  });

  it('회원은 물품을 등록하거나 전체 기록을 볼 수 없다', async () => {
    const { member } = await setup();
    await expectCode(member.createItem({ name: 'x', description: '' }), 'FORBIDDEN');
    await expectCode(member.listAllRequests(), 'FORBIDDEN');
    await expectCode(member.listAllLoans(), 'FORBIDDEN');
  });

  it('회원은 본인 기록만 본다', async () => {
    const { member, member2, item } = await setup();
    await member.createRequest(item.id, TODAY);
    expect(await member2.listMyRequests()).toEqual([]);
  });
});

describe('시드 데이터', () => {
  it('데모 계정과 물품이 준비되어 있다', async () => {
    const api = createDemoApi(createDemoStore(), { now: NOW });
    await api.signIn('admin@billim.dev', DEMO_PASSWORD);
    expect((await api.listItems()).length).toBeGreaterThanOrEqual(5);
    expect((await api.listAllRequests()).some((r) => r.status === 'pending')).toBe(true);
  });
});
