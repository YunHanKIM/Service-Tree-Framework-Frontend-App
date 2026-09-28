import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../../api';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { StateView } from '../../components/StateView';
import { SubmitButton } from '../../components/SubmitButton';
import { colors, spacing } from '../../components/theme';
import { AFFECTS, useApiMutation, useItem } from '../../hooks/queries';

export default function ItemFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return id ? <EditItem id={id} /> : <ItemForm />;
}

function EditItem({ id }: { id: string }) {
  const item = useItem(id);
  return (
    <StateView loading={item.isPending} error={item.error} empty={false} onRetry={() => item.refetch()}>
      {item.data && <ItemForm initial={item.data} />}
    </StateView>
  );
}

interface FormProps {
  initial?: { id: string; name: string; description: string; isActive: boolean };
}

function ItemForm({ initial }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  useEffect(() => setIsActive(initial?.isActive ?? true), [initial?.isActive]);

  const save = useApiMutation(
    () =>
      initial
        ? api.updateItem(initial.id, { name: name.trim(), description: description.trim(), isActive })
        : api.createItem({ name: name.trim(), description: description.trim() }),
    AFFECTS.item,
  );

  return (
    <>
      <Stack.Screen options={{ title: initial ? '물품 수정' : '물품 등록' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Field label="이름" value={name} onChangeText={setName} autoCapitalize="sentences" />
          <Field
            label="설명"
            value={description}
            onChangeText={setDescription}
            multiline
            autoCapitalize="sentences"
          />
          {initial && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>대여 가능하게 두기</Text>
              <Switch accessibilityLabel="사용 여부" value={isActive} onValueChange={setIsActive} />
            </View>
          )}
          {initial && !isActive && (
            <Text style={styles.hint}>사용 중지하면 회원이 신청할 수 없습니다. 대여 중인 물품은 사용 중지할 수 없습니다.</Text>
          )}
          <SubmitButton
            label={initial ? '저장' : '등록'}
            disabled={!name.trim()}
            onPress={async () => {
              const saved = await save(undefined);
              router.replace({ pathname: '/item/[id]', params: { id: saved.id } });
            }}
          />
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  switchLabel: { fontSize: 15, color: colors.text },
  hint: { fontSize: 14, color: colors.subtext },
});
