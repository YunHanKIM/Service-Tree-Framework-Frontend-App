import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays } from '../domain/dueDate';
import { colors, spacing } from './theme';

interface Props {
  today: string;
  value: string;
  onChange: (date: string) => void;
}

const QUICK = [
  { label: '오늘', days: 0 },
  { label: '내일', days: 1 },
  { label: '3일 후', days: 3 },
  { label: '7일 후', days: 7 },
];

/** 반납 예정일 선택. 오늘보다 앞선 날짜는 고를 수 없다(서버도 거부한다). */
export function DueDatePicker({ today, value, onChange }: Props) {
  const atMin = value <= today;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>반납 예정일</Text>
      <View style={styles.row}>
        <Step label="하루 앞당기기" symbol="−" disabled={atMin} onPress={() => onChange(addDays(value, -1))} />
        <Text style={styles.value} accessibilityLiveRegion="polite">
          {value === today ? `${value} (오늘)` : value}
        </Text>
        <Step label="하루 미루기" symbol="+" onPress={() => onChange(addDays(value, 1))} />
      </View>
      <View style={styles.row}>
        {QUICK.map((q) => {
          const date = addDays(today, q.days);
          const selected = date === value;
          return (
            <Pressable
              key={q.label}
              accessibilityRole="button"
              accessibilityLabel={q.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(date)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{q.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Step({
  label,
  symbol,
  disabled = false,
  onPress,
}: {
  label: string;
  symbol: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, disabled && styles.stepDisabled]}
    >
      <Text style={styles.stepText}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.subtext },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  value: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  step: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.4 },
  stepText: { fontSize: 22, color: colors.text },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextSelected: { color: colors.primaryText, fontWeight: '600' },
});
