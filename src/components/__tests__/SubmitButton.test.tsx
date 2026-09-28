import { act, render, screen, userEvent } from '@testing-library/react-native';
import { ApiError } from '../../domain/errors';
import { SubmitButton } from '../SubmitButton';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SubmitButton', () => {
  it('처리 중에 두 번 눌러도 요청은 한 번만 간다', async () => {
    const d = deferred();
    const onPress = jest.fn(() => d.promise);
    const user = userEvent.setup();
    await render(<SubmitButton label="대여 신청" onPress={onPress} />);

    const button = screen.getByRole('button', { name: '대여 신청' });
    await user.press(button);
    await user.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '대여 신청' })).toBeDisabled();
    await act(async () => d.resolve());
  });

  it('실패하면 원인 문구를 보여주고 다시 누를 수 있다', async () => {
    const onPress = jest.fn().mockRejectedValueOnce(new ApiError('CONFLICT')).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    await render(<SubmitButton label="승인" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: '승인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/이미 다른 신청이 승인/);

    const button = screen.getByRole('button', { name: '승인' });
    expect(button).toBeEnabled();
    await user.press(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('보이는 글자와 별도로 접근성 이름을 줄 수 있다', async () => {
    await render(<SubmitButton label="반납 요청" accessibilityLabel="카메라 삼각대 반납 요청" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: '카메라 삼각대 반납 요청' })).toHaveTextContent('반납 요청');
  });

  it('성공하면 오류 문구가 사라진다', async () => {
    const onPress = jest.fn().mockRejectedValueOnce(new ApiError('NETWORK')).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    await render(<SubmitButton label="반납 요청" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: '반납 요청' }));
    expect(await screen.findByRole('alert')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: '반납 요청' }));
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });
});
