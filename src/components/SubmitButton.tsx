import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../domain/errors';
import { AppButton, type ButtonVariant } from './AppButton';
import { colors, spacing } from './theme';

interface Props {
  label: string;
  onPress: () => Promise<unknown>;
  variant?: ButtonVariant;
  disabled?: boolean;
}

/**
 * 서버 변경 요청용 버튼. 처리 중에는 비활성화하고, 실패하면 원인 문구를 버튼 아래에 보여준다.
 * 비활성화 state가 렌더되기 전의 연속 탭도 막도록 ref로 잠근다.
 */
export function SubmitButton({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handlePress() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      await onPress();
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <AppButton label={label} variant={variant} disabled={disabled || pending} onPress={handlePress}>
        {pending ? (
          <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.primary} />
        ) : undefined}
      </AppButton>
      {error != null && (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage(error)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  error: { color: colors.danger, fontSize: 14 },
});
