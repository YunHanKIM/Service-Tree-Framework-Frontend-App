import { Tabs } from 'expo-router';
import { Pressable, Text, type ColorValue } from 'react-native';
import { useSession } from '../../auth/SessionProvider';
import { colors } from '../../components/theme';

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const { profile, signOut } = useSession();
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        sceneStyle: { backgroundColor: colors.bg },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="로그아웃"
            onPress={signOut}
            style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: colors.primary, fontSize: 15 }}>로그아웃</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '물품', tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="my"
        options={{ title: '내 대여', tabBarIcon: ({ color }) => <TabIcon symbol="☰" color={color} /> }}
      />
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen
          name="admin"
          options={{ title: '관리자', tabBarIcon: ({ color }) => <TabIcon symbol="⚙" color={color} /> }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}
