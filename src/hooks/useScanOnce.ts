import { useCallback, useRef, useState } from 'react';

/**
 * expo-camera는 같은 QR을 프레임마다 감지한다. 첫 감지만 처리하고 reset 전까지 잠근다.
 * state는 렌더 전까지 반영되지 않으므로 잠금은 ref로 판단한다.
 */
export function useScanOnce(onScan: (data: string) => void) {
  const lockRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const handle = useCallback(
    (data: string) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setLocked(true);
      onScan(data);
    },
    [onScan],
  );

  const reset = useCallback(() => {
    lockRef.current = false;
    setLocked(false);
  }, []);

  return { handle, reset, locked };
}
