import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '@/components/AnimatedView';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAlertsStore } from '@/store/alerts.store';

export default function Alerts() {
  const { alerts, loadAlerts, markRead } = useAlertsStore();
  const unread = alerts.filter(a => !a.read).length;

  useEffect(() => { loadAlerts(); }, []);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <LinearGradient colors={gradients.background} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>Centre de notifications</Text>
              <Text style={styles.headerTitle}>Alertes</Text>
            </View>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread} non lues</Text>
              </View>
            )}
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shield-checkmark" size={40} color={colors.success} />
              </View>
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptySub}>Votre santé est stable. Continuez ainsi !</Text>
            </View>
          ) : (
            alerts.map((alert, index) => {
              const isDanger = alert.level === 'danger';
              return (
                <AnimatedView key={alert._id} delay={100 + index * 60} animation="up">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => markRead(alert._id)}
                    style={[styles.card, !alert.read && { borderLeftColor: isDanger ? colors.danger : '#C98A1B', borderLeftWidth: 4 }]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: isDanger ? '#FBE3E3' : '#FBEFD4' }]}>
                      <Ionicons name={isDanger ? 'warning' : 'alert-circle'} size={22} color={isDanger ? colors.danger : '#C98A1B'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardTitle}>{alert.title}</Text>
                      <Text style={styles.cardMsg}>{alert.message}</Text>
                      <Text style={styles.cardDate}>
                        {new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
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
  scroll: { padding: spacing.lg, paddingTop: 20, paddingBottom: 160 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  headerSubtitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { ...typography.display, color: colors.primaryDeeper },
  unreadBadge: { backgroundColor: colors.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  unreadText: { ...typography.caption, color: '#FFF', fontWeight: '700' },

  card: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm, ...shadows.soft },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...typography.body, fontWeight: '800', color: colors.primaryDeeper },
  cardMsg: { ...typography.caption, color: colors.text, marginTop: 4, lineHeight: 18 },
  cardDate: { ...typography.caption, color: colors.textMuted, marginTop: 6, fontSize: 10 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.soft },
  emptyTitle: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});