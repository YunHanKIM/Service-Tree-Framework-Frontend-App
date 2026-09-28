import { buildItemQr, parseItemQr } from '../qr';

const ID = '3f2b8c1e-4a5d-4e6f-9a7b-1c2d3e4f5a6b';

describe('parseItemQr', () => {
  it('정상 형식이면 물품 id를 반환한다', () => {
    expect(parseItemQr(`billim://item/${ID}`)).toEqual({ ok: true, itemId: ID });
  });

  it('앞뒤 공백은 무시한다', () => {
    expect(parseItemQr(`  billim://item/${ID}\n`)).toEqual({ ok: true, itemId: ID });
  });

  it('uuid 대문자도 소문자로 정규화한다', () => {
    expect(parseItemQr(`billim://item/${ID.toUpperCase()}`)).toEqual({ ok: true, itemId: ID });
  });

  it('빈 문자열은 empty', () => {
    expect(parseItemQr('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('다른 앱의 QR은 foreign', () => {
    expect(parseItemQr('https://example.com')).toEqual({ ok: false, reason: 'foreign' });
    expect(parseItemQr(ID)).toEqual({ ok: false, reason: 'foreign' });
  });

  it('형식은 맞지만 id가 uuid가 아니면 invalid_id', () => {
    expect(parseItemQr('billim://item/123')).toEqual({ ok: false, reason: 'invalid_id' });
    expect(parseItemQr('billim://item/')).toEqual({ ok: false, reason: 'invalid_id' });
    expect(parseItemQr(`billim://item/${ID}/extra`)).toEqual({ ok: false, reason: 'invalid_id' });
  });
});

describe('buildItemQr', () => {
  it('parseItemQr로 되돌릴 수 있는 값을 만든다', () => {
    expect(parseItemQr(buildItemQr(ID))).toEqual({ ok: true, itemId: ID });
  });
});
