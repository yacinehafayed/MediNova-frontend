import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Animated, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';

import AnimatedView from '@/components/AnimatedView';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useHealthStore } from '@/store/health.store';
import { useAppointmentsStore } from '@/store/appointments.store';
import { useMedicationsStore } from '@/store/medications.store';
import { useNotificationsStore } from '@/store/notifications.store';

const METRICS: Record<string, any> = {
  heart_rate: { label: 'Cœur', unit: 'bpm', icon: 'heart', color: '#E56B6F', soft: '#FBE3E3', normal: [60, 100] },
  blood_pressure: { label: 'Tension', unit: 'mmHg', icon: 'pulse', color: '#E67E22', soft: '#FDF2E9', normal: [90, 130] },
  weight: { label: 'Poids', unit: 'kg', icon: 'fitness', color: '#5E7F63', soft: '#DCE8DC', normal: [40, 150] },
  blood_sugar: { label: 'Glycémie', unit: 'g/L', icon: 'water', color: '#4A7BEB', soft: '#E8F0FC', normal: [0.7, 1.1] },
};

const TIPS = [
  "Buvez un grand verre d'eau dès le réveil pour hydrater votre corps.",
  "Prenez 5 minutes pour respirer profondément et réduire votre stress.",
  "Marcher 10 minutes après chaque repas améliore la digestion.",
  "Une pomme par jour aide à maintenir un bon taux de cholestérol.",
  "Évitez les écrans 1h avant le coucher pour un meilleur sommeil.",
  "Le magnésium (amandes, épinards) aide à réduire la fatigue.",
  "Notez vos émotions : le mental influence directement la santé physique.",
];

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { measurements = [], loadMeasurements } = useHealthStore();
  const { appointments = [], loadAppointments } = useAppointmentsStore();
  const { medications = [], loadMedications, markTaken } = useMedicationsStore();

  // 👈 Ajout de deleteNotification et checkReminders
  const { notifications, loadNotifications, markAsRead, markAllAsRead, deleteNotification, checkReminders } = useNotificationsStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAlerts, setReadAlerts] = useState<string[]>([]);

  const loadAll = async () => {
    await Promise.all([
      loadMeasurements?.(),
      loadAppointments?.(),
      loadMedications?.(),
    ]);

    await checkReminders?.();
    await loadNotifications?.();
  };

  useEffect(() => {
    loadAll();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour,' : hour < 18 ? 'Bon après-midi,' : 'Bonsoir,';

  const latestMeasures = useMemo(() => {
    const result: Record<string, any> = {};
    Object.keys(METRICS).forEach(type => {
      const found = measurements.find(m => m.type === type);
      if (found) result[type] = found;
    });
    return result;
  }, [measurements]);

  const chartDataByType = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.keys(METRICS).forEach(type => {
      const filtered = measurements.filter(m => m.type === type).slice(0, 7).reverse();
      result[type] = filtered.map(m => ({ value: m.value }));
    });
    return result;
  }, [measurements]);

  const alerts = useMemo(() => {
    const list: any[] = [];
    Object.keys(latestMeasures).forEach(type => {
      const m = latestMeasures[type];
      const range = METRICS[type].normal;
      if (m.value > range[1]) {
        list.push({ type, level: m.value > range[1] * 1.2 ? 'danger' : 'warning', message: `${METRICS[type].label} élevé (${m.value} ${m.unit})` });
      } else if (m.value < range[0]) {
        list.push({ type, level: 'warning', message: `${METRICS[type].label} bas (${m.value} ${m.unit})` });
      }
    });
    return list;
  }, [latestMeasures]);

  const allNotifications = useMemo(() => {
    const alertNotifs = alerts.map((a, idx) => {
      const alertId = `alert-${idx}`;
      return {
        _id: alertId,
        type: 'alert',
        title: a.level === 'danger' ? 'Alerte critique' : 'Valeur à surveiller',
        message: a.message,
        level: a.level,
        read: readAlerts.includes(alertId),
        createdAt: new Date().toISOString(),
      };
    });
    return [...alertNotifs, ...notifications];
  }, [alerts, notifications, readAlerts]);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const healthScore = useMemo(() => {
    if (measurements.length === 0) return 100;
    const penalty = alerts.reduce((acc, a) => acc + (a.level === 'danger' ? 30 : 15), 0);
    return Math.max(0, 100 - penalty);
  }, [alerts, measurements]);
  const scoreLabel = healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Bon' : healthScore >= 50 ? 'À surveiller' : 'Critique';

  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter(a => new Date(a.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [appointments]);

  const todaysMeds = useMemo(() => {
    const today = new Date().toDateString();
    return medications.filter(m => {
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      return new Date() >= start && new Date() <= end;
    }).map(m => ({
      ...m,
      takenToday: m.taken?.some((r: any) => new Date(r.date).toDateString() === today),
    }));
  }, [medications]);

  const dailyTip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);

  const goals = [
    { icon: 'water' as const, label: 'Eau', value: 1.4, target: 2, unit: 'L', color: '#4A90B8' },
    { icon: 'footsteps' as const, label: 'Pas', value: 6420, target: 10000, unit: '', color: colors.primary },
    { icon: 'moon' as const, label: 'Sommeil', value: 7.4, target: 8, unit: 'h', color: '#7C6BC4' },
  ];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  const quickActions = [
    { icon: 'add' as const, label: 'Mesure', color: colors.primaryDark, onPress: () => router.push('/(tabs)/health') },
    { icon: 'chatbubbles-outline' as const, label: 'Assistant', color: '#4A7BEB', onPress: () => router.push('/(tabs)/assistant') },
    { icon: 'calendar-outline' as const, label: 'Rendez-vous', color: '#E67E22', onPress: () => router.push('/(tabs)/appointments') },
    { icon: 'medkit-outline' as const, label: 'Médicaments', color: '#9B59B6', onPress: () => router.push('/(tabs)/profile') },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <LinearGradient colors={gradients.background} style={styles.flex}>
        <View style={[styles.orb, { top: -100, right: -80, width: 280, height: 280 }]} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >

          <AnimatedView delay={100} animation="down" style={styles.header}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')} style={styles.avatarButton}>
              <LinearGradient colors={gradients.gold} style={styles.avatarRing}>
                <View style={styles.avatar}><Ionicons name="person" size={22} color={colors.primaryDark} /></View>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.hello}>{greeting}</Text>
              <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotifications(!showNotifications)}>
              <Ionicons name={showNotifications ? 'notifications' : 'notifications-outline'} size={22} color={colors.primaryDark} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </AnimatedView>

          {showNotifications && (
            <AnimatedView animation="down" delay={0}>
              <View style={styles.notifPanel}>
                <View style={styles.notifHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifPanelTitle}>
                      {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
                    </Text>
                    <Text style={styles.notifPanelSubtitle}>Alertes et rappels</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.notifClose}>
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {allNotifications.length === 0 ? (
                  <View style={styles.notifEmpty}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    <Text style={styles.notifEmptyText}>Aucune notification pour l'instant.</Text>
                  </View>
                ) : (
                  allNotifications.slice(0, 5).map((notif, idx) => {
                    const isRead = notif.read;
                    const iconName = notif.type === 'alert' ? 'warning'
                      : notif.type === 'appointment' ? 'calendar'
                      : notif.type === 'medication' ? 'medkit'
                      : 'information-circle';
                    const iconColor = notif.level === 'danger' ? colors.danger
                      : notif.level === 'warning' ? '#E67E22'
                      : colors.primary;
                    return (
                      <TouchableOpacity
                        key={notif._id}
                        style={[
                          styles.notifItem,
                          { borderLeftColor: iconColor },
                          isRead && { opacity: 0.5 }
                        ]}
                        onPress={() => {
                          if (notif._id.startsWith('alert-')) {
                            setReadAlerts(prev => [...prev, notif._id]);
                          } else {
                            markAsRead(notif._id);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.notifItemIcon, { backgroundColor: iconColor + '20' }]}>
                          <Ionicons name={iconName} size={16} color={iconColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.notifItemTitle, !isRead && { fontWeight: '800' }]}>{notif.title}</Text>
                          <Text style={styles.notifItemSub}>{notif.message}</Text>
                          <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{timeAgo(notif.createdAt)}</Text>
                        </View>


                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          {!isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: iconColor }} />}

                          {!notif._id.startsWith('alert-') && (
                            <TouchableOpacity
                              onPress={() => deleteNotification?.(notif._id)}
                              style={{ padding: 4 }}
                            >
                              <Ionicons name="trash-outline" size={16} color={colors.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={() => markAllAsRead()} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                      <Text style={[styles.notifSeeAllText, { color: colors.primary }]}>Tout lire</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => { setShowNotifications(false); router.push('/(tabs)/health'); }}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
                  >
                    <Text style={styles.notifSeeAllText}>Voir mes mesures</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedView>
          )}

          <AnimatedView delay={200} animation="down">
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/assistant')} style={styles.search}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <TextInput style={styles.searchInput} placeholder="Posez une question sur votre santé" placeholderTextColor={colors.textMuted} editable={false} pointerEvents="none" />
              <LinearGradient colors={gradients.primary} style={styles.mic}><Ionicons name="mic" size={18} color="#fff" /></LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          <AnimatedView delay={230} animation="up">
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.9}>
              <LinearGradient colors={['#E53E3E', '#C53030']} style={styles.emergencyGradient}>
                <Ionicons name="alert-circle" size={20} color="#FFF" />
                <Text style={styles.emergencyText}>URGENCE</Text>
                <Ionicons name="call" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          <AnimatedView delay={280} animation="up" style={styles.quickRow}>
            {quickActions.map((q) => (
              <TouchableOpacity key={q.label} activeOpacity={0.85} onPress={q.onPress} style={styles.quickItem}>
                <View style={[styles.quickIcon, { backgroundColor: q.color }]}>
                  <Ionicons name={q.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </AnimatedView>

          <AnimatedView delay={360} animation="zoom" style={{ marginTop: spacing.lg }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, shadows.strong]}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View style={[styles.ring, { borderColor: healthScore >= 85 ? '#7BE0A0' : healthScore >= 70 ? '#F2C35B' : '#FF8A85' }]}>
                  <Text style={styles.ringValue}>{healthScore}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 18 }}>
                  <Text style={styles.heroKicker}>SCORE SANTÉ</Text>
                  <Text style={styles.heroTitle}>{scoreLabel}</Text>
                  <Text style={styles.liveText}>{measurements.length} mesures · {alerts.length} alerte{alerts.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.85} style={styles.heroBtn} onPress={() => router.push('/(tabs)/profile')}>
                <Text style={styles.heroBtnText}>Voir mon dossier</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
            </LinearGradient>
          </AnimatedView>

          <AnimatedView delay={400} animation="up" style={styles.tipCard}>
            <LinearGradient colors={['#FDE68A', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipGradient}>
              <View style={styles.tipIcon}><Ionicons name="bulb" size={24} color="#FFF" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.tipLabel}>CONSEIL DU JOUR</Text>
                <Text style={styles.tipText}>{dailyTip}</Text>
              </View>
            </LinearGradient>
          </AnimatedView>

          <AnimatedView delay={420} animation="up" style={styles.sectionRow}>
            <Text style={styles.section}>Mes dernières mesures</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/health')}><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
          </AnimatedView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList} style={styles.hBleed}>
            {Object.keys(METRICS).map((key, idx) => {
              const c = METRICS[key];
              const m = latestMeasures[key];
              const isAlert = alerts.some(a => a.type === key);
              const chartData = chartDataByType[key] || [];

              return (
                <AnimatedView key={key} delay={460 + idx * 70} animation="zoom">
                  <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/health')} style={{ width: 180 }}>
                    <BlurView intensity={40} tint="light" style={[styles.glass, styles.metricCard, isAlert && { borderColor: '#E67E22', borderWidth: 2 }]}>
                      <View style={styles.metricHead}>
                        <View style={[styles.chip, { backgroundColor: c.soft }]}><Ionicons name={c.icon} size={16} color={c.color} /></View>
                        {isAlert && <Ionicons name="warning" size={16} color="#E67E22" />}
                      </View>
                      <Text style={styles.metricLabel}>{c.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={[styles.metricValue, isAlert && { color: '#E67E22' }]}>{m ? m.value : '—'}</Text>
                        <Text style={styles.metricUnit}> {c.unit}</Text>
                      </View>
                      {chartData.length > 1 && (
                        <View style={{ marginLeft: -12, marginTop: 8 }}>
                          <LineChart data={chartData} width={130} height={40} color={c.color} thickness={2} hideDataPoints hideYAxisText hideAxesAndRules curved initialSpacing={0} spacing={18} />
                        </View>
                      )}
                      <Text style={styles.metricDate}>{m ? timeAgo(m.date) : 'Aucune donnée'}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </AnimatedView>
              );
            })}
          </ScrollView>

          <AnimatedView delay={600} animation="up" style={styles.sectionRow}>
            <Text style={styles.section}>Objectifs du jour</Text>
          </AnimatedView>
          <AnimatedView delay={650} animation="zoom">
            <BlurView intensity={40} tint="light" style={styles.goalsCard}>
              {goals.map((g, idx) => {
                const progress = Math.min(100, (g.value / g.target) * 100);
                return (
                  <View key={g.label} style={[styles.goalRow, idx > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]}>
                    <View style={[styles.goalIcon, { backgroundColor: g.color + '20' }]}><Ionicons name={g.icon} size={18} color={g.color} /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={styles.goalLabel}>{g.label}</Text>
                        <Text style={styles.goalValue}>{g.value}{g.unit} / {g.target}{g.unit}</Text>
                      </View>
                      <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: g.color }]} /></View>
                    </View>
                  </View>
                );
              })}
            </BlurView>
          </AnimatedView>

          <AnimatedView delay={700} animation="up" style={styles.sectionRow}>
            <Text style={styles.section}>Prochain rendez-vous</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}><Text style={styles.seeAll}>Gérer</Text></TouchableOpacity>
          </AnimatedView>

          {nextAppointment ? (
            <AnimatedView delay={750} animation="zoom">
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')} activeOpacity={0.9}>
                <BlurView intensity={50} tint="light" style={styles.apptCard}>
                  <View style={styles.apptDate}>
                    <Text style={styles.apptDay}>{new Date(nextAppointment.date).getDate()}</Text>
                    <Text style={styles.apptMonth}>{new Date(nextAppointment.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.apptSpecialty}>{nextAppointment.specialty}</Text>
                    <Text style={styles.apptDoctor}>{nextAppointment.doctor}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.apptTime}>{new Date(nextAppointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </BlurView>
              </TouchableOpacity>
            </AnimatedView>
          ) : (
            <AnimatedView delay={750} animation="fade">
              <View style={styles.emptyCard}><Ionicons name="calendar-outline" size={28} color={colors.textMuted} /><Text style={styles.emptyText}>Aucun rendez-vous prévu</Text></View>
            </AnimatedView>
          )}

          <AnimatedView delay={800} animation="up" style={styles.sectionRow}>
            <Text style={styles.section}>Médicaments du jour</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}><Text style={styles.seeAll}>Gérer</Text></TouchableOpacity>
          </AnimatedView>

          {todaysMeds.length > 0 ? (
            <AnimatedView delay={850} animation="zoom">
              <BlurView intensity={50} tint="light" style={styles.medsCard}>
                {todaysMeds.map((med: any, idx: number) => (
                  <View key={med._id} style={[styles.medRow, idx > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]}>
                    <View style={styles.medIcon}><Ionicons name="medkit" size={18} color="#9B59B6" /></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medInfo}>{med.dosage} · {med.times.join(', ')}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.medCheck, med.takenToday && styles.medCheckDone]}
                      onPress={() => markTaken?.(med._id, med.times[0], med.takenToday ? 'missed' : 'taken')}
                    >
                      {med.takenToday && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </TouchableOpacity>
                  </View>
                ))}
              </BlurView>
            </AnimatedView>
          ) : (
            <AnimatedView delay={850} animation="fade">
              <View style={styles.emptyCard}><Ionicons name="medkit-outline" size={28} color={colors.textMuted} /><Text style={styles.emptyText}>Aucun médicament aujourd'hui</Text></View>
            </AnimatedView>
          )}

          <Text style={styles.disclaimer}>
            MediNova fournit des informations générales et ne remplace pas l'avis d'un professionnel de santé. En cas d'urgence, appelez le 15 / 112.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: 20, paddingBottom: 150 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  avatarButton: { borderRadius: 27 },
  avatarRing: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  hello: { ...typography.caption, color: colors.textMuted },
  name: { ...typography.title, fontSize: 20, color: colors.primaryDeeper },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  notifDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 2, borderColor: '#FFF' },

  notifPanel: { backgroundColor: '#FFF', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  notifPanelTitle: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper, fontSize: 16 },
  notifPanelSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  notifClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  notifEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.sm, backgroundColor: '#F0FDF4', borderRadius: radius.md, marginBottom: spacing.sm },
  notifEmptyText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  notifItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, backgroundColor: '#F8FAF9', borderRadius: radius.md, marginBottom: 8, borderLeftWidth: 3 },
  notifItemIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  notifItemTitle: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper, fontSize: 13 },
  notifItemSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  notifSeeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  notifSeeAllText: { ...typography.caption, color: colors.primary, fontWeight: '700' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 58, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.85)', paddingLeft: 18, paddingRight: 6, borderWidth: 1, borderColor: '#fff', ...shadows.soft },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  mic: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },

  emergencyBtn: { marginTop: spacing.md, borderRadius: radius.pill, overflow: 'hidden' },
  emergencyGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48 },
  emergencyText: { color: '#FFF', fontWeight: '800', letterSpacing: 2, fontSize: 13 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  quickLabel: { fontSize: 11.5, fontWeight: '600', color: colors.primaryDark },

  hero: { borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden' },
  heroGlow: { position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  ring: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  heroKicker: { ...typography.caption, color: '#BFD3C1', letterSpacing: 1.6 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.6, marginTop: 2 },
  liveText: { color: '#CFE0D1', fontSize: 12, marginTop: 6 },
  heroBtn: { marginTop: spacing.md, height: 48, borderRadius: radius.pill, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },

  tipCard: { marginTop: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', ...shadows.soft },
  tipGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  tipIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  tipLabel: { ...typography.caption, color: 'rgba(255,255,255,0.9)', fontWeight: '800', letterSpacing: 1.2 },
  tipText: { ...typography.body, color: '#FFF', marginTop: 4, lineHeight: 18 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  section: { ...typography.subtitle, fontSize: 17, fontWeight: '700', color: colors.primaryDeeper },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  hBleed: { marginHorizontal: -spacing.lg },
  hList: { paddingHorizontal: spacing.lg, gap: spacing.md },

  glass: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.55)', ...shadows.soft },
  chip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  metricCard: { padding: spacing.md },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { ...typography.caption, color: colors.textMuted, marginTop: 12 },
  metricValue: { fontSize: 26, fontWeight: '800', color: colors.primaryDeeper, letterSpacing: -0.6 },
  metricUnit: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  metricDate: { ...typography.caption, color: colors.textMuted, marginTop: 6 },

  goalsCard: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  goalIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper },
  goalValue: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  apptCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft },
  apptDate: { width: 56, height: 64, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  apptDay: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  apptMonth: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  apptSpecialty: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  apptDoctor: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper, marginTop: 2 },
  apptTime: { ...typography.caption, color: colors.textMuted },

  medsCard: { borderRadius: radius.lg, padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  medIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(155,89,182,0.15)', alignItems: 'center', justifyContent: 'center' },
  medName: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper },
  medInfo: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  medCheck: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#9B59B6', alignItems: 'center', justifyContent: 'center' },
  medCheckDone: { backgroundColor: '#9B59B6', borderColor: '#9B59B6' },

  emptyCard: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.5)', gap: 8 },
  emptyText: { ...typography.body, color: colors.textMuted },

  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.xl, paddingHorizontal: spacing.md },
});