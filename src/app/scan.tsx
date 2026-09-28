import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { api } from '../api';
import { AppButton } from '../components/AppButton';
import { CameraPermissionView } from '../components/CameraPermissionView';
import { colors, spacing } from '../components/theme';
import { ApiError, errorMessage } from '../domain/errors';
import { parseItemQr } from '../domain/qr';
import { useScanOnce } from '../hooks/useScanOnce';

const QR_ERROR: Record<'empty' | 'foreign' | 'invalid_id', string> = {
  empty: 'QR 코드를 읽지 못했습니다.',
  foreign: '빌림 QR 코드가 아닙니다.',
  invalid_id: '손상된 QR 코드입니다. 관리자에게 새 QR을 요청해 주세요.',
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onScan = useCallback(async (data: string) => {
    const parsed = parseItemQr(data);
    if (!parsed.ok) {
      setError(QR_ERROR[parsed.reason]);
      return;
    }
    // 미등록 물품인지 확인한 뒤 이동한다. 이 요청은 스캔 잠금 덕분에 한 번만 간다.
    setChecking(true);
    try {
      await api.getItem(parsed.itemId);
      router.replace({ pathname: '/item/[id]', params: { id: parsed.itemId } });
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'NOT_FOUND' ? '등록되지 않은 물품입니다.' : errorMessage(e));
    } finally {
      setChecking(false);
    }
  }, []);

  const scan = useScanOnce(onScan);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="불러오는 중" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <CameraPermissionView
        canAskAgain={permission.canAskAgain}
        onRequest={requestPermission}
        onOpenSettings={() => Linking.openSettings()}
        onSearchInstead={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scan.locked ? undefined : (result) => scan.handle(result.data)}
      />
      <View style={styles.frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <View style={styles.panel}>
        {checking ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel="물품 확인 중" />
        ) : error ? (
          <>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <AppButton
              label="다시 스캔"
              onPress={() => {
                setError(null);
                scan.reset();
              }}
            />
          </>
        ) : (
          <Text style={styles.hint}>물품에 붙은 QR 코드를 네모 안에 맞춰 주세요.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  panel: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.card,
  },
  hint: { fontSize: 15, color: colors.text, textAlign: 'center' },
  error: { fontSize: 15, color: colors.danger, textAlign: 'center' },
});
