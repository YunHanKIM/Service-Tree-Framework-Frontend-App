import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../../api';
import { useSession } from '../../auth/SessionProvider';
import { AppButton } from '../../components/AppButton';
import { Card } from '../../components/Card';
import { DueDatePicker } from '../../components/DueDatePicker';
import { ItemQr } from '../../components/ItemQr';
import { StateView } from '../../components/StateView';
import { StatusBadge } from '../../components/StatusBadge';
import { SubmitButton } from '../../components/SubmitButton';
import { itemBadge } from '../../components/labels';
import { colors, spacing } from '../../components/theme';
import { addDays, todayInSeoul } from '../../domain/dueDate';
import { AFFECTS, useApiMutation, useItem } from '../../hooks/queries';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const item = useItem(id);
  const today = todayInSeoul();
  const [dueDate, setDueDate] = useState(addDays(today, 3));
  const createRequest = useApiMutation((due: string) => api.createRequest(id, due), AFFECTS.request);

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <Stack.Screen options={{ title: item.data?.name ?? '물품 상세' }} />
      <StateView loading={item.isPending} error={item.error} empty={false} onRetry={() => item.refetch()}>
        {item.data && (
          <ScrollView contentContainerStyle={styles.container}>
            <Card>
              <Text accessibilityRole="header" style={styles.name}>
                {item.data.name}
              </Text>
              <StatusBadge {...itemBadge(item.data.status)} />
              <Text style={styles.desc}>{item.data.description || '설명이 없습니다.'}</Text>
            </Card>

            <Card>
              {item.data.myPending ? (
                <>
                  <StatusBadge label="내 신청 대기" tone="info" />
                  <Text style={styles.desc}>관리자 승인을 기다리고 있습니다. 내 대여 탭에서 취소할 수 있습니다.</Text>
                  <AppButton label="내 대여 보기" variant="secondary" onPress={() => router.navigate('/my')} />
                </>
              ) : item.data.status === 'available' ? (
                <>
                  <DueDatePicker today={today} value={dueDate} onChange={setDueDate} />
                  <SubmitButton
                    label="대여 신청"
                    onPress={async () => {
                      await createRequest(dueDate);
                      router.navigate('/my');
                    }}
                  />
                </>
              ) : (
                <Text style={styles.desc}>
                  {item.data.status === 'on_loan'
                    ? '지금은 다른 회원이 대여 중입니다. 반납된 뒤 신청할 수 있습니다.'
                    : '사용 중지된 물품이라 대여할 수 없습니다.'}
                </Text>
              )}
            </Card>

            {isAdmin && (
              <Card>
                <Text style={styles.section}>관리자</Text>
                <ItemQr itemId={item.data.id} name={item.data.name} />
                <AppButton
                  label="물품 정보 수정"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/admin/item-form', params: { id: item.data.id } })}
                />
              </Card>
            )}
          </ScrollView>
        )}
      </StateView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  desc: { fontSize: 15, color: colors.subtext, lineHeight: 22 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
});
