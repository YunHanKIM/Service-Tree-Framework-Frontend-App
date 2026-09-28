const PREFIX = 'billim://item/';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type QrParseResult =
  | { ok: true; itemId: string }
  | { ok: false; reason: 'empty' | 'foreign' | 'invalid_id' };

export function parseItemQr(raw: string): QrParseResult {
  const value = raw.trim();
  if (value === '') return { ok: false, reason: 'empty' };
  if (!value.startsWith(PREFIX)) return { ok: false, reason: 'foreign' };

  const id = value.slice(PREFIX.length).toLowerCase();
  if (!UUID.test(id)) return { ok: false, reason: 'invalid_id' };
  return { ok: true, itemId: id };
}

export function buildItemQr(itemId: string): string {
  return PREFIX + itemId;
}
