import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, spacing } from './theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
}

/** 라벨이 붙은 입력칸. 라벨을 접근성 이름으로도 쓴다. */
export function Field({ label, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        style={[styles.input, input.multiline && styles.multiline]}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.subtext },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  multiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
});
