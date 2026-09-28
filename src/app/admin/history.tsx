import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { StateView } from '../../components/StateView';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime, loanBadge, requestBadge } from '../../components/labels';
import { colors, spacing } from '../../components/theme';
import { useAllLoans, useAllRequests } from '../../hooks/queries';

type Tab = 'requests' | 'loans';

export default function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('requests');
  const requests = useAllRequests();
  const loans = useAllLoans();
  const query = tab === 'requests' ? requests : loans;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['requests', 'loans'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabSelected]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextSelected]}>
              {t === 'requests' ? '신청 기록' : '대여 기록'}
            </Text>
          </Pressable>
        ))}
      </View>
      <StateView
        loading={query.isPending}
        error={query.error}
        empty={query.data?.length === 0}
        emptyText="기록이 없습니다."
        onRetry={() => query.refetch()}
      >
        {tab === 'requests' ? (
          <FlatList
            data={requests.data}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={requests.isRefetching} onRefresh={() => requests.refetch()} />}
            renderItem={({ item: r }) => (
              <Card>
                <Text style={styles.name}>{r.itemName}</Text>
                <StatusBadge {...requestBadge(r.status)} />
                <Text style={styles.meta}>
                  {r.userName} · 반납 예정일 {r.dueDate}
                </Text>
                <Text style={styles.meta}>
                  신청 {formatDateTime(r.createdAt)} · 처리 {formatDateTime(r.processedAt)}
                </Text>
                {r.rejectReason && <Text style={styles.meta}>사유: {r.rejectReason}</Text>}
              </Card>
            )}
          />
        ) : (
          <FlatList
            data={loans.data}
            keyExtractor={(l) => l.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loans.isRefetching} onRefresh={() => loans.refetch()} />}
            renderItem={({ item: l }) => (
              <Card>
                <Text style={styles.name}>{l.itemName}</Text>
                <StatusBadge {...loanBadge(l.status)} />
                <Text style={styles.meta}>
                  {l.userName} · 반납 예정일 {l.dueDate}
                </Text>
                <Text style={styles.meta}>
                  대여 {formatDateTime(l.borrowedAt)} · 반납 {formatDateTime(l.returnedAt)}
                </Text>
              </Card>
            )}
          />
        )}
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { borderBottomWidth: 3, borderColor: colors.primary },
  tabText: { fontSize: 15, color: colors.subtext },
  tabTextSelected: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.subtext },
});
