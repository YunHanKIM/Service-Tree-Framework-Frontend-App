import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../api';
import { AppButton } from '../../components/AppButton';
import { Card, SectionTitle } from '../../components/Card';
import { Field } from '../../components/Field';
import { StateView } from '../../components/StateView';
import { StatusBadge } from '../../components/StatusBadge';
import { SubmitButton } from '../../components/SubmitButton';
import { formatDateTime } from '../../components/labels';
import { colors, spacing } from '../../components/theme';
import { isOverdue, todayInSeoul } from '../../domain/dueDate';
import type { RentalRequest } from '../../domain/types';
import { AFFECTS, useAllLoans, useAllRequests, useApiMutation } from '../../hooks/queries';

export default function AdminScreen() {
  const requests = useAllRequests();
  const loans = useAllLoans();
  const confirmReturn = useApiMutation((loanId: string) => api.confirmReturn(loanId), AFFECTS.loan);
  const today = todayInSeoul();

  const pending = requests.data?.filter((r) => r.status === 'pending') ?? [];
  const returning = loans.data?.filter((l) => l.status === 'return_requested') ?? [];
  const overdue = loans.data?.filter((l) => l.status === 'active' && isOverdue(l.dueDate, today)) ?? [];
  const refetch = () => Promise.all([requests.refetch(), loans.refetch()]);

  return (
    <StateView
      loading={requests.isPending || loans.isPending}
      error={requests.error ?? loans.error}
      empty={false}
      onRetry={refetch}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={requests.isRefetching || loans.isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <AppButton label="물품 등록" onPress={() => router.push('/admin/item-form')} />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton label="전체 기록" variant="secondary" onPress={() => router.push('/admin/history')} />
          </View>
        </View>

        <SectionTitle count={pending.length}>승인 대기 신청</SectionTitle>
        {pending.length === 0 && <Text style={styles.none}>처리할 신청이 없습니다.</Text>}
        {pending.map((r) => (
          <PendingRequestCard key={r.id} request={r} />
        ))}

        <SectionTitle count={returning.length}>반납 확인 대기</SectionTitle>
        {returning.length === 0 && <Text style={styles.none}>확인할 반납이 없습니다.</Text>}
        {returning.map((l) => (
          <Card key={l.id}>
            <Text style={styles.name}>{l.itemName}</Text>
            <Text style={styles.meta}>
              {l.userName} · 반납 요청 {formatDateTime(l.returnRequestedAt)}
            </Text>
            <SubmitButton label="실물 확인, 반납 완료" onPress={() => confirmReturn(l.id)} />
          </Card>
        ))}

        <SectionTitle count={overdue.length}>기한 경과</SectionTitle>
        {overdue.length === 0 && <Text style={styles.none}>기한이 지난 대여가 없습니다.</Text>}
        {overdue.map((l) => (
          <Card key={l.id}>
            <Text style={styles.name}>{l.itemName}</Text>
            <StatusBadge label="기한 경과" tone="danger" />
            <Text style={styles.meta}>
              {l.userName} · 반납 예정일 {l.dueDate}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </StateView>
  );
}

function PendingRequestCard({ request }: { request: RentalRequest }) {
  const [reason, setReason] = useState('');
  const approve = useApiMutation(() => api.approveRequest(request.id), AFFECTS.loan);
  const reject = useApiMutation(() => api.rejectRequest(request.id, reason), AFFECTS.request);

  return (
    <Card>
      <Text style={styles.name}>{request.itemName}</Text>
      <Text style={styles.meta}>
        {request.userName} · 반납 예정일 {request.dueDate} · 신청 {formatDateTime(request.createdAt)}
      </Text>
      <SubmitButton label={`${request.userName} 신청 승인`} onPress={() => approve(undefined)} />
      <Field label="거절 사유(선택)" value={reason} onChangeText={setReason} placeholder="예: 점검 예정" />
      <SubmitButton label={`${request.userName} 신청 거절`} variant="danger" onPress={() => reject(undefined)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.subtext },
  none: { fontSize: 14, color: colors.muted },
});
