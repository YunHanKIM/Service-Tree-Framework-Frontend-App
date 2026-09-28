import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors, spacing } from './theme';

interface Props {
  canAskAgain: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
  onSearchInstead: () => void;
}

export function CameraPermissionView({ canAskAgain, onRequest, onOpenSettings, onSearchInstead }: Props) {
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        카메라 권한이 필요합니다
      </Text>
      {canAskAgain ? (
        <>
          <Text style={styles.body}>물품에 붙은 QR 코드를 읽으려면 카메라 접근을 허용해 주세요.</Text>
          <AppButton label="카메라 권한 허용" onPress={onRequest} />
        </>
      ) : (
        <>
          <Text style={styles.body}>
            카메라 권한이 거부되어 있습니다. 설정에서 카메라 권한을 켜거나, 목록에서 물품을 검색해 주세요.
          </Text>
          <AppButton label="설정 열기" onPress={onOpenSettings} />
        </>
      )}
      <AppButton label="목록에서 검색하기" variant="secondary" onPress={onSearchInstead} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.subtext, lineHeight: 22 },
});
