import { render, screen, userEvent } from '@testing-library/react-native';
import { CameraPermissionView } from '../CameraPermissionView';

const handlers = () => ({
  onRequest: jest.fn(),
  onOpenSettings: jest.fn(),
  onSearchInstead: jest.fn(),
});

describe('CameraPermissionView', () => {
  it('다시 물을 수 있으면 권한 요청 버튼을 보여준다', async () => {
    const h = handlers();
    const user = userEvent.setup();
    await render(<CameraPermissionView canAskAgain {...h} />);

    await user.press(screen.getByRole('button', { name: '카메라 권한 허용' }));
    expect(h.onRequest).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '설정 열기' })).not.toBeOnTheScreen();
  });

  it('거부되어 다시 물을 수 없으면 설정 안내와 목록 검색 경로를 보여준다', async () => {
    const h = handlers();
    const user = userEvent.setup();
    await render(<CameraPermissionView canAskAgain={false} {...h} />);

    expect(screen.getByText(/설정에서 카메라 권한/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: '설정 열기' }));
    await user.press(screen.getByRole('button', { name: '목록에서 검색하기' }));
    expect(h.onOpenSettings).toHaveBeenCalled();
    expect(h.onSearchInstead).toHaveBeenCalled();
  });
});
