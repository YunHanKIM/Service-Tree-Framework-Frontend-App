import { addDays, isOverdue, todayInSeoul, validateDueDate } from '../dueDate';

describe('todayInSeoul', () => {
  it('UTC 14:59는 서울 기준 같은 날 23:59', () => {
    expect(todayInSeoul(new Date('2026-09-28T14:59:59Z'))).toBe('2026-09-28');
  });

  it('UTC 15:00은 서울 기준 다음 날 자정', () => {
    expect(todayInSeoul(new Date('2026-09-28T15:00:00Z'))).toBe('2026-09-29');
  });
});

describe('validateDueDate', () => {
  const today = '2026-09-28';

  it('오늘은 허용한다', () => {
    expect(validateDueDate('2026-09-28', today)).toEqual({ ok: true });
  });

  it('미래는 허용한다', () => {
    expect(validateDueDate('2026-10-05', today)).toEqual({ ok: true });
  });

  it('과거는 past', () => {
    expect(validateDueDate('2026-09-27', today)).toEqual({ ok: false, reason: 'past' });
  });

  it('형식이 틀리거나 존재하지 않는 날짜는 invalid', () => {
    expect(validateDueDate('2026/10/01', today)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateDueDate('2026-02-30', today)).toEqual({ ok: false, reason: 'invalid' });
    expect(validateDueDate('', today)).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('addDays', () => {
  it('월과 연도 경계를 넘는다', () => {
    expect(addDays('2026-09-28', 3)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });
});

describe('isOverdue', () => {
  it('반납 예정일 다음 날부터 기한 경과', () => {
    expect(isOverdue('2026-09-28', '2026-09-28')).toBe(false);
    expect(isOverdue('2026-09-28', '2026-09-29')).toBe(true);
  });
});
