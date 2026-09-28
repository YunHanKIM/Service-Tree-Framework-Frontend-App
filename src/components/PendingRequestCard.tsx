import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { RentalRequest } from '../domain/types';
import { Card } from './Card';
import { Field } from './Field';
import { SubmitButton } from './SubmitButton';
import { formatDateTime } from './labels';
import { colors } from './theme';

interface Props {
  request: RentalRequest;
  onApprove: () => Promise<unknown>;
  onReject: (reason: string) => Promise<unknown>;
}

/** 관리자 대기 신청 카드. 승인·거절 중 하나가 처리 중이면 카드 전체를 잠가 같은 신청에 요청이 두 번 가지 않게 한다. */
export function PendingRequestCard({ request, onApprove, onReject }: Props) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const target = `${request.userName}의 ${request.itemName} 신청`;

  const exclusive = (action: () => Promise<unknown>) => async () => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Text style={styles.name}>{request.itemName}</Text>
      <Text style={styles.meta}>
        {request.userName} · 반납 예정일 {request.dueDate} · 신청 {formatDateTime(request.createdAt)}
      </Text>
      <SubmitButton
        label="승인"
        accessibilityLabel={`${target} 승인`}
        disabled={busy}
        onPress={exclusive(onApprove)}
      />
      <Field
        label="거절 사유(선택)"
        value={reason}
        onChangeText={setReason}
        placeholder="예: 점검 예정"
        editable={!busy}
      />
      <SubmitButton
        label="거절"
        accessibilityLabel={`${target} 거절`}
        variant="danger"
        disabled={busy}
        onPress={exclusive(() => onReject(reason))}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.subtext },
});
