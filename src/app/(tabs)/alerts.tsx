import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '@/components/AnimatedView';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAlertsStore } from '@/store/alerts.store';
import { useThemeStore } from '@/store/theme.store';
import { useNotificationsStore } from '@/store/notifications.store';

export default function Alerts() {
  const { alerts, loadAlerts, markRead } = useAlertsStore();
  const { notifications, loadNotifications, markAsRead: markNotificationRead,} = useNotificationsStore();

  const isDark = useThemeStore((s) => s.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;

  const allNotifications = useMemo(() => {
    const healthItems = alerts.map((alert) => ({
      ...alert,
      kind: 'health' as const,
    }));

    const generalItems = notifications.map((notification) => ({
      ...notification,
      kind: 'notification' as const,
    }));

    return [...healthItems, ...generalItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [alerts, notifications]);

  const unread = allNotifications.filter(item => !item.read).length;

  useEffect(() => { loadAlerts(); loadNotifications(); }, []);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.bg }]} edges={['top']}>
      <LinearGradient colors={activeGradients.background} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Centre de notifications</Text>
              <Text style={[styles.headerTitle, { color: palette.primaryDeeper }]}>Notifications</Text>
            </View>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread} non lues</Text>
              </View>
            )}
          </View>

          {allNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[ styles.emptyIcon, isDark && { backgroundColor: palette.surface }, ]}>
                <Ionicons name="shield-checkmark" size={40} color={palette.success} />
              </View>

              <Text style={[styles.emptyTitle, { color: palette.primaryDeeper }]}>Aucune notification</Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>Vous n'avez aucune alerte ou rappel pour le moment.</Text>
            </View>
          ) : (    
            allNotifications.map((item, index) => {
              const isHealthAlert = item.kind === 'health';
              const isDanger = item.level === 'danger';
              const iconName = isHealthAlert ? 'warning' : item.type === 'medication' ? 'medkit' : item.type === 'appointment' ? 'calendar' : item.type === 'alert' ? 'alert-circle' : 'information-circle';
              // Category colors: danger red, warning amber, medication blue, appointment green.
              const iconColor = isHealthAlert
                ? isDanger ? '#D9534F' : '#E6A23C'
                : item.type === 'medication' ? '#4F83CC'
                : item.type === 'appointment' ? '#65A77A'
                : '#4F83CC';
              const iconBackground = isHealthAlert
                ? isDanger ? '#FCE8E8' : '#FFF3E0'
                : item.type === 'medication' ? '#E8F0FC'
                : item.type === 'appointment' ? '#E8F5E9'
                : '#E8F0FC';
              
              return (
                <AnimatedView key={`${item.kind}-${item._id}`} delay={100 + index * 60} animation="up">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => isHealthAlert  ? markRead(item._id)  : markNotificationRead(item._id) }
                    style={[
                      styles.card,
                      isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, borderWidth: 1,},
                      { borderLeftColor: iconColor, borderLeftWidth: 4 },
                    ]}
                  >
                    <View style={[ styles.iconWrap, { backgroundColor: iconBackground }, ]} >
                      <Ionicons name={iconName as any} size={22} color={iconColor} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[ styles.cardTitle, { color: palette.primaryDeeper }, ]} > {item.title}</Text>
                      <Text style={[ styles.cardMsg, { color: palette.text }, ]}> {item.message} </Text>
                      <Text style={[ styles.cardDate, { color: palette.textMuted }, ]}> {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit',minute: '2-digit', })} </Text>
                    </View>

                    {!item.read && (
                      <View style={{ width: 9,  height: 9, borderRadius: 5, backgroundColor: iconColor, alignSelf: 'center', }}/>
                    )}
                  </TouchableOpacity>
                </AnimatedView>
              );
            })
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: 20, paddingBottom: 160,},

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg,},
  headerSubtitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5,},
  headerTitle: { ...typography.display, color: colors.primaryDeeper,},
  unreadBadge: { backgroundColor: colors.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,},
  unreadText: { ...typography.caption, color: '#FFF', fontWeight: '700',},

  card: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm, ...shadows.soft,},
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',},
  cardTitle: { ...typography.body, fontWeight: '800', color: colors.primaryDeeper,},
  cardMsg: { ...typography.caption, color: colors.text, marginTop: 4, lineHeight: 18,},
  cardDate: { ...typography.caption, color: colors.textMuted, marginTop: 6, fontSize: 10,},

  emptyContainer: { alignItems: 'center', marginTop: 60,},
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.soft,},
  emptyTitle: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 4,},
});