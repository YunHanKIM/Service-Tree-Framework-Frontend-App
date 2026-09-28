import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * React Native에서는 탭을 오가도 TanStack Query가 자동으로 다시 조회하지 않는다.
 * 화면에 다시 들어올 때 다시 조회해 다른 기기의 변경(승인·반납 확인 등)을 보여준다.
 * 첫 포커스는 마운트 직후라 이미 조회 중이므로 건너뛴다. (TanStack Query React Native 문서의 패턴)
 * refetch는 렌더마다 새 함수일 수 있어 ref로 들고 있는다 — deps에 넣으면 렌더마다 효과가 다시 돌아 조회가 반복된다.
 */
export function useRefreshOnFocus(refetch: () => Promise<unknown>) {
  const firstFocus = useRef(true);
  const latest = useRef(refetch);
  latest.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      latest.current();
    }, []),
  );
}
