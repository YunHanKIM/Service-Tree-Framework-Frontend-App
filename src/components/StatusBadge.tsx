import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export type Tone = 'success' | 'warning' | 'danger' | 'muted' | 'info';

const TONES: Record<Tone, { fg: string; bg: string; icon: string }> = {
  success: { fg: colors.success, bg: colors.successBg, icon: '●' },
  warning: { fg: colors.warning, bg: colors.warningBg, icon: '◐' },
  danger: { fg: colors.danger, bg: colors.dangerBg, icon: '!' },
  muted: { fg: colors.muted, bg: colors.mutedBg, icon: '–' },
  info: { fg: colors.primary, bg: '#E8F0FE', icon: '◆' },
};

/** 상태는 색만으로 구분하지 않는다 — 기호와 글자를 함께 보여준다. */
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} accessible accessibilityLabel={`상태: ${label}`}>
      <Text style={[styles.text, { color: t.fg }]}>
        {t.icon} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  text: { fontSize: 13, fontWeight: '600' },
});
