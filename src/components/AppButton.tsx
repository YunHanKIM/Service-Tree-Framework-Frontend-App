import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** 라벨 대신 보여줄 내용(진행 표시 등). 접근성 이름은 label을 쓴다. */
  children?: ReactNode;
}

export function AppButton({ label, onPress, variant = 'primary', disabled = false, children }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {children ?? (
        <Text
          style={[styles.label, variant === 'secondary' && styles.labelAlt, variant === 'danger' && styles.labelDanger]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { color: colors.primaryText, fontSize: 16, fontWeight: '600' },
  labelAlt: { color: colors.text },
  labelDanger: { color: colors.danger },
});
