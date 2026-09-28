import { useEffect } from 'react';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import { SessionProvider, useSession } from '../auth/SessionProvider';
import { colors } from '../components/theme';
import { isNetworkError } from '../domain/errors';

const queryClient = new QueryClient({
  defaultOptions: {
    // 네트워크 오류만 한 번 재시도한다. 권한·없음 같은 서버 판정은 재시도해도 같다.
    // 앱(또는 브라우저 탭)으로 돌아오면 staleTime과 관계없이 다시 조회한다 — 다른 기기의 승인·반납을 바로 보여주기 위해.
    queries: {
      retry: (count, error) => count < 1 && isNetworkError(error),
      staleTime: 10_000,
      refetchOnWindowFocus: 'always',
    },
    mutations: { retry: false },
  },
});

export default function RootLayout() {
  // 앱이 포그라운드로 돌아오면 오래된 쿼리를 다시 조회한다(웹은 TanStack이 브라우저 focus를 직접 감지).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="dark" />
        <RootStack />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { profile, restoring } = useSession();

  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="불러오는 중" />
      </View>
    );
  }

  const signedIn = profile != null;
  const isAdmin = profile?.role === 'admin';

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerBackTitle: '뒤로' }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'QR 스캔' }} />
        <Stack.Screen name="item/[id]" options={{ title: '물품 상세' }} />
        <Stack.Protected guard={isAdmin}>
          <Stack.Screen name="admin/item-form" options={{ title: '물품 등록' }} />
          <Stack.Screen name="admin/history" options={{ title: '전체 기록' }} />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
