import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../../components/AppButton';
import { StateView } from '../../components/StateView';
import { StatusBadge } from '../../components/StatusBadge';
import { itemBadge } from '../../components/labels';
import { colors, spacing } from '../../components/theme';
import type { Item, ItemStatus } from '../../domain/types';
import { useItems } from '../../hooks/queries';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';

const FILTERS: { label: string; value?: ItemStatus }[] = [
  { label: '전체' },
  { label: '대여 가능', value: 'available' },
  { label: '대여 중', value: 'on_loan' },
  { label: '사용 중지', value: 'inactive' },
];

export default function ItemListScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ItemStatus | undefined>();
  const items = useItems({ query, status });
  useRefreshOnFocus(items.refetch);

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <TextInput
          accessibilityLabel="물품 이름 검색"
          placeholder="물품 이름 검색"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          returnKeyType="search"
        />
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const selected = f.value === status;
            return (
              <Pressable
                key={f.label}
                accessibilityRole="button"
                accessibilityLabel={`${f.label} 필터`}
                accessibilityState={{ selected }}
                onPress={() => setStatus(f.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <AppButton label="QR 스캔" onPress={() => router.push('/scan')} />
      </View>

      <StateView
        loading={items.isPending}
        error={items.error}
        empty={items.data?.length === 0}
        emptyText={query || status ? '조건에 맞는 물품이 없습니다.' : '등록된 물품이 없습니다.'}
        onRetry={() => items.refetch()}
      >
        <FlatList
          data={items.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={items.isRefetching} onRefresh={() => items.refetch()} />
          }
        />
      </StateView>
    </View>
  );
}

function ItemRow({ item }: { item: Item }) {
  const badge = itemBadge(item.status);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${badge.label}${item.myPending ? ', 내 신청 대기' : ''}`}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
        <StatusBadge {...badge} />
        {item.myPending && <StatusBadge label="내 신청 대기" tone="info" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: colors.primaryText, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.subtext },
});
