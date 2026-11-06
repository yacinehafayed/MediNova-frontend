import { colors, shadows } from '@/constants/theme';
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isDark = useThemeStore((s) => s.isDark);
  const bottomInset = insets.bottom > 0 ? insets.bottom + 10 : 20;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: {
          backgroundColor: isDark ? '#0A140F' : '#EAF0E8',
        },
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: bottomInset,
            height: 72 + (insets.bottom > 0 ? 10 : 0),
            paddingBottom: insets.bottom > 0 ? 10 : 0,
            backgroundColor: isDark ? '#13271D' : colors.surfaceSolid,
          },
        ],
        tabBarActiveTintColor: isDark ? '#8CB990' : colors.primaryDeeper,
        tabBarInactiveTintColor: isDark ? '#5A7A63' : colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={focused ? colors.textOnDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={focused ? colors.textOnDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={focused ? colors.textOnDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={focused ? colors.textOnDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={focused ? colors.textOnDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 62,
    elevation: 0,
    borderRadius: 32,
    ...shadows.strong,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderTopWidth: 0,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
  },
  activeIconContainer: {
    backgroundColor: colors.primaryDark,
    ...shadows.soft,
  },
});