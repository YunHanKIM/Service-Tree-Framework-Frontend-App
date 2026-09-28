import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { buildItemQr } from '../domain/qr';
import { colors, spacing } from './theme';

/** 관리자용 물품 QR. 인쇄해 물품에 붙인다. 값은 물품 id만 담는다. */
export function ItemQr({ itemId, name }: { itemId: string; name: string }) {
  const value = buildItemQr(itemId);
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${name} QR 코드`}>
      <QRCode value={value} size={180} />
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: 12 },
  value: { fontSize: 11, color: colors.subtext },
});
