import { deriveItemStatus } from '../itemStatus';

describe('deriveItemStatus', () => {
  it('대여 기록이 없으면 대여 가능', () => {
    expect(deriveItemStatus({ isActive: true }, [])).toBe('available');
  });

  it('활성 대여가 있으면 대여 중', () => {
    expect(deriveItemStatus({ isActive: true }, [{ status: 'active' }])).toBe('on_loan');
  });

  it('반납 요청 중이어도 대여 중', () => {
    expect(deriveItemStatus({ isActive: true }, [{ status: 'return_requested' }])).toBe('on_loan');
  });

  it('반납 완료 기록만 있으면 대여 가능', () => {
    expect(
      deriveItemStatus({ isActive: true }, [{ status: 'returned' }, { status: 'returned' }]),
    ).toBe('available');
  });

  it('사용 중지가 가장 우선한다', () => {
    expect(deriveItemStatus({ isActive: false }, [])).toBe('inactive');
    expect(deriveItemStatus({ isActive: false }, [{ status: 'active' }])).toBe('inactive');
  });
});
