// 날짜는 'YYYY-MM-DD' 문자열로 다룬다. 기준 시간대는 Asia/Seoul(UTC+9, 서머타임 없음).
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayInSeoul(now: Date = new Date()): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);
}

function isRealDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type DueDateResult = { ok: true } | { ok: false; reason: 'invalid' | 'past' };

export function validateDueDate(dueDate: string, today: string): DueDateResult {
  if (!isRealDate(dueDate)) return { ok: false, reason: 'invalid' };
  // 같은 형식의 문자열은 사전순 비교가 날짜순 비교와 같다.
  if (dueDate < today) return { ok: false, reason: 'past' };
  return { ok: true };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string, today: string): boolean {
  return today > dueDate;
}
