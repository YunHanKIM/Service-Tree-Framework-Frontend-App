import { act, render, screen, userEvent } from '@testing-library/react-native';
import type { RentalRequest } from '../../domain/types';
import { PendingRequestCard } from '../PendingRequestCard';

const request: RentalRequest = {
  id: 'r1',
  itemId: 'i1',
  itemName: '빔 프로젝터',
  userId: 'u1',
  userName: '김회원',
  dueDate: '2026-10-01',
  status: 'pending',
  rejectReason: null,
  processedBy: null,
  processedAt: null,
  createdAt: '2026-09-28T03:00:00Z',
};

describe('PendingRequestCard', () => {
  it('승인 처리 중에는 같은 카드의 거절 버튼도 비활성화된다', async () => {
    let finish!: () => void;
    const onApprove = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onReject = jest.fn(() => Promise.resolve());
    const user = userEvent.setup();
    await render(<PendingRequestCard request={request} onApprove={onApprove} onReject={onReject} />);

    await user.press(screen.getByRole('button', { name: '김회원의 빔 프로젝터 신청 승인' }));
    const reject = screen.getByRole('button', { name: '김회원의 빔 프로젝터 신청 거절' });
    expect(reject).toBeDisabled();
    await user.press(reject);
    expect(onReject).not.toHaveBeenCalled();

    await act(async () => finish());
    expect(screen.getByRole('button', { name: '김회원의 빔 프로젝터 신청 거절' })).toBeEnabled();
  });

  it('거절 사유를 함께 보낸다', async () => {
    const onReject = jest.fn(() => Promise.resolve());
    const user = userEvent.setup();
    await render(<PendingRequestCard request={request} onApprove={jest.fn()} onReject={onReject} />);

    await user.type(screen.getByLabelText('거절 사유(선택)'), '점검 예정');
    await user.press(screen.getByRole('button', { name: '김회원의 빔 프로젝터 신청 거절' }));
    expect(onReject).toHaveBeenCalledWith('점검 예정');
  });
});
