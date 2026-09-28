import { useState } from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { DueDatePicker } from '../DueDatePicker';

function Harness({ today }: { today: string }) {
  const [value, setValue] = useState(today);
  return <DueDatePicker today={today} value={value} onChange={setValue} />;
}

describe('DueDatePicker', () => {
  it('오늘에서는 하루 전으로 갈 수 없다', async () => {
    await render(<Harness today="2026-09-28" />);
    expect(screen.getByRole('button', { name: '하루 앞당기기' })).toBeDisabled();
    expect(screen.getByText('2026-09-28 (오늘)')).toBeOnTheScreen();
  });

  it('빠른 선택과 하루 단위 조정', async () => {
    const user = userEvent.setup();
    await render(<Harness today="2026-09-28" />);

    await user.press(screen.getByRole('button', { name: '7일 후' }));
    expect(screen.getByText('2026-10-05')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: '하루 앞당기기' }));
    expect(screen.getByText('2026-10-04')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: '하루 미루기' }));
    expect(screen.getByText('2026-10-05')).toBeOnTheScreen();
  });
});
