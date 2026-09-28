import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { ApiError } from '../../domain/errors';
import { StateView } from '../StateView';

describe('StateView', () => {
  it('로딩 중이면 진행 표시를 보여준다', async () => {
    await render(<StateView loading error={null} empty={false} onRetry={jest.fn()}><Text>내용</Text></StateView>);
    expect(screen.getByLabelText('불러오는 중')).toBeOnTheScreen();
    expect(screen.queryByText('내용')).not.toBeOnTheScreen();
  });

  it('오류면 원인 문구와 다시 시도 버튼을 보여준다', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    await render(
      <StateView loading={false} error={new ApiError('NETWORK')} empty={false} onRetry={onRetry}>
        <Text>내용</Text>
      </StateView>,
    );
    expect(screen.getByText(/네트워크 연결/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('비어 있으면 빈 상태 문구를, 아니면 내용을 보여준다', async () => {
    const { rerender } = await render(
      <StateView loading={false} error={null} empty emptyText="검색 결과가 없습니다." onRetry={jest.fn()}>
        <Text>내용</Text>
      </StateView>,
    );
    expect(screen.getByText('검색 결과가 없습니다.')).toBeOnTheScreen();

    await rerender(
      <StateView loading={false} error={null} empty={false} onRetry={jest.fn()}>
        <Text>내용</Text>
      </StateView>,
    );
    expect(screen.getByText('내용')).toBeOnTheScreen();
  });
});
