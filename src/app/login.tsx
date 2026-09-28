import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, apiMode } from '../api';
import { DEMO_PASSWORD } from '../api/demoApi';
import { useSession } from '../auth/SessionProvider';
import { AppButton } from '../components/AppButton';
import { Field } from '../components/Field';
import { SubmitButton } from '../components/SubmitButton';
import { colors, spacing } from '../components/theme';

type Mode = 'signIn' | 'signUp' | 'reset';

const DEMO_ACCOUNTS = [
  { label: '회원(김회원)으로 체험', email: 'member@billim.dev' },
  { label: '회원(이회원)으로 체험', email: 'member2@billim.dev' },
  { label: '관리자로 체험', email: 'admin@billim.dev' },
];

export default function LoginScreen() {
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const titles: Record<Mode, string> = { signIn: '로그인', signUp: '회원가입', reset: '비밀번호 재설정' };
  const switchMode = (next: Mode) => {
    setMode(next);
    setNotice(null);
  };

  async function submit() {
    if (mode === 'signIn') return signIn(email, password);
    if (mode === 'signUp') return signUp(email, password, displayName.trim() || email.split('@')[0]);
    await api.resetPassword(email);
    setNotice('재설정 메일을 보냈습니다. 메일의 링크를 확인해 주세요.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.brand}>
            빌림
          </Text>
          <Text style={styles.tagline}>QR로 빌리고 반납하는 동아리 공용 물품</Text>

          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>
              {titles[mode]}
            </Text>
            <Field label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            {mode !== 'reset' && (
              <Field label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
            )}
            {mode === 'signUp' && <Field label="이름" value={displayName} onChangeText={setDisplayName} />}
            <SubmitButton
              label={titles[mode]}
              onPress={submit}
              disabled={!email.trim() || (mode !== 'reset' && !password)}
            />
            {notice && <Text style={styles.notice}>{notice}</Text>}

            <View style={styles.links}>
              {mode !== 'signIn' && <AppButton label="로그인으로" variant="secondary" onPress={() => switchMode('signIn')} />}
              {mode !== 'signUp' && <AppButton label="회원가입" variant="secondary" onPress={() => switchMode('signUp')} />}
              {mode !== 'reset' && (
                <AppButton label="비밀번호 재설정" variant="secondary" onPress={() => switchMode('reset')} />
              )}
            </View>
          </View>

          {apiMode === 'demo' && (
            <View style={styles.card}>
              <Text style={styles.title}>데모 계정</Text>
              <Text style={styles.hint}>
                데모 백엔드로 실행 중입니다. 데이터는 앱을 새로고침하면 처음 상태로 돌아갑니다. 비밀번호는 모두 {DEMO_PASSWORD}
                입니다.
              </Text>
              {DEMO_ACCOUNTS.map((a) => (
                <SubmitButton
                  key={a.email}
                  label={a.label}
                  variant="secondary"
                  onPress={() => signIn(a.email, DEMO_PASSWORD)}
                />
              ))}
            </View>
          )}
          <Text style={styles.footer}>백엔드: {apiMode === 'demo' ? '데모(메모리)' : 'Supabase'}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: spacing.xl },
  tagline: { fontSize: 15, color: colors.subtext },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  hint: { fontSize: 14, color: colors.subtext, lineHeight: 20 },
  notice: { fontSize: 14, color: colors.success },
  links: { gap: spacing.sm },
  footer: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
