import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { Card, SectionTitle } from '../../components/Card';
import { StateView } from '../../components/StateView';
import { StatusBadge } from '../../components/StatusBadge';
import { SubmitButton } from '../../components/SubmitButton';
import { formatDateTime, loanBadge, requestBadge } from '../../components/labels';
import { colors, spacing } from '../../components/theme';
import { isOverdue, todayInSeoul } from '../../domain/dueDate';
import { AFFECTS, useApiMutation, useMyLoans, useMyRequests } from '../../hooks/queries';

export default function MyRentalsScreen() {
  const loans = useMyLoans();
  const requests = useMyRequests();
  const requestReturn = useApiMutation((loanId: string) => api.requestReturn(loanId), AFFECTS.loan);
  const cancel = useApiMutation((requestId: string) => api.cancelRequest(requestId), AFFECTS.request);
  const today = todayInSeoul();

  const openLoans = loans.data?.filter((l) => l.status !== 'returned') ?? [];
  const pending = requests.data?.filter((r) => r.status === 'pending') ?? [];
  const pastRequests = requests.data?.filter((r) => r.status !== 'pending') ?? [];
  const refetch = () => Promise.all([loans.refetch(), requests.refetch()]);

  return (
    <StateView
      loading={loans.isPending || requests.isPending}
      error={loans.error ?? requests.error}
      empty={openLoans.length + pending.length + pastRequests.length === 0}
      emptyText="아직 대여 기록이 없습니다. 물품 탭에서 신청해 보세요."
      onRetry={refetch}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loans.isRefetching || requests.isRefetching} onRefresh={refetch} />}
      >
        <SectionTitle count={openLoans.length}>대여 중</SectionTitle>
        {openLoans.length === 0 && <Text style={styles.none}>대여 중인 물품이 없습니다.</Text>}
        {openLoans.map((loan) => (
          <Card key={loan.id}>
            <Text style={styles.name}>{loan.itemName}</Text>
            <View style={styles.badges}>
              <StatusBadge {...loanBadge(loan.status)} />
              {isOverdue(loan.dueDate, today) && <StatusBadge label="기한 경과" tone="danger" />}
            </View>
            <Text style={styles.meta}>반납 예정일 {loan.dueDate}</Text>
            {loan.status === 'active' ? (
              <SubmitButton label="반납 요청" onPress={() => requestReturn(loan.id)} />
            ) : (
              <Text style={styles.meta}>관리자가 실물을 확인하면 반납이 완료됩니다.</Text>
            )}
          </Card>
        ))}

        <SectionTitle count={pending.length}>승인 대기</SectionTitle>
        {pending.length === 0 && <Text style={styles.none}>대기 중인 신청이 없습니다.</Text>}
        {pending.map((r) => (
          <Card key={r.id}>
            <Text style={styles.name}>{r.itemName}</Text>
            <StatusBadge {...requestBadge(r.status)} />
            <Text style={styles.meta}>
              반납 예정일 {r.dueDate} · 신청 {formatDateTime(r.createdAt)}
            </Text>
            <SubmitButton label="신청 취소" variant="danger" onPress={() => cancel(r.id)} />
          </Card>
        ))}

        <SectionTitle count={pastRequests.length}>지난 신청</SectionTitle>
        {pastRequests.map((r) => (
          <Card key={r.id}>
            <Text style={styles.name}>{r.itemName}</Text>
            <StatusBadge {...requestBadge(r.status)} />
            <Text style={styles.meta}>
              반납 예정일 {r.dueDate} · 처리 {formatDateTime(r.processedAt)}
            </Text>
            {r.rejectReason && <Text style={styles.meta}>사유: {r.rejectReason}</Text>}
          </Card>
        ))}
      </ScrollView>
    </StateView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  badges: { flexDirection: 'row', gap: spacing.sm },
  meta: { fontSize: 14, color: colors.subtext },
  none: { fontSize: 14, color: colors.muted },
});
