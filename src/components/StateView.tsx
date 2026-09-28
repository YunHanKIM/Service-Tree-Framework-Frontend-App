import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../domain/errors';
import { AppButton } from './AppButton';
import { colors, spacing } from './theme';

interface Props {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyText?: string;
  onRetry: () => void;
  children: ReactNode;
}

/** 데이터 화면의 로딩·오류(재시도)·빈 상태를 한 곳에서 처리한다. */
export function StateView({ loading, error, empty, emptyText = '표시할 내용이 없습니다.', onRetry, children }: Props) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="불러오는 중" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMessage(error)}</Text>
        <AppButton label="다시 시도" variant="secondary" onPress={onRetry} />
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  error: { color: colors.danger, fontSize: 15, textAlign: 'center' },
  empty: { color: colors.subtext, fontSize: 15, textAlign: 'center' },
});
