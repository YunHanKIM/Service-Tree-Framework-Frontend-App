import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from './theme';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ children, count }: { children: string; count?: number }) {
  return (
    <Text accessibilityRole="header" style={styles.section}>
      {children}
      {count !== undefined ? ` (${count})` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.md },
});
