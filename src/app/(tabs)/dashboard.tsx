import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Animated, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';

import AnimatedView from '@/components/AnimatedView';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useAlertsStore } from '@/store/alerts.store';
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

  const isDark = useThemeStore((s) => s.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;

  const { measurements = [], loadMeasurements } = useHealthStore();
  const { appointments = [], loadAppointments } = useAppointmentsStore();
  const { medications = [], loadMedications, markTaken } = useMedicationsStore();

  //  Ajout de deleteNotification et checkReminders
  const { notifications, loadNotifications, markAsRead, markAllAsRead, deleteNotification, checkReminders } = useNotificationsStore();

  const {
    alerts: healthAlerts,
    loadAlerts,
    markRead: markHealthAlertRead,
  } = useAlertsStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [expandedScoreDetails, setExpandedScoreDetails] = useState<string | null>(null);
  const [scoreDayKey, setScoreDayKey] = useState(() => new Date().toDateString());

  // Recompute the daily score at the next local midnight.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeout = setTimeout(() => setScoreDayKey(new Date().toDateString()), Math.max(1000, nextMidnight.getTime() - now.getTime() + 250));
    return () => clearTimeout(timeout);
  }, [scoreDayKey]);

  const loadAll = async () => {
    await Promise.all([
      loadMeasurements?.(),
      loadAppointments?.(),
      loadMedications?.(),
      loadAlerts(),
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
      const filtered = measurements
        .filter(m => m.type === type)
        .slice(0, 7)
        .reverse();

      result[type] = filtered
        .map(m => ({
          value: type === 'blood_pressure' ? m.systolic : m.value,
        }))
        .filter(item => typeof item.value === 'number');
    });

    return result;
  }, [measurements]);

  const alerts = healthAlerts;

  const allNotifications = useMemo(() => {
    const alertNotifs = healthAlerts.map((alert) => ({
      _id: alert._id,
      type: 'alert' as const,
      title: alert.title,
      message: alert.message,
      level: alert.level,
      read: alert.read,
      createdAt: alert.createdAt,
    }));

    return [...alertNotifs, ...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [healthAlerts, notifications]);



  const unreadCount = allNotifications.filter(n => !n.read).length;

  const scoreResult = useMemo(() => {
    // Use the device's local calendar day so the score resets at local midnight.
    const now = new Date();
    const isToday = (value: unknown) => {
      const date = new Date(value as any);
      return Number.isFinite(date.getTime()) &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
    };

    const todayMeasurements = measurements.filter((measurement) => isToday(measurement.date));
    const todayByType: Record<string, any[]> = {};
    todayMeasurements.forEach((measurement) => {
      if (!todayByType[measurement.type]) todayByType[measurement.type] = [];
      todayByType[measurement.type].push(measurement);
    });

    const birthDate = user?.dateOfBirth ? new Date(user.dateOfBirth) : null;
    let age: number | null = null;
    if (birthDate && Number.isFinite(birthDate.getTime()) && birthDate <= now) {
      age = now.getFullYear() - birthDate.getFullYear();
      if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
        age -= 1;
      }
    }

    type ScoreStatus = 'normal' | 'warning' | 'danger';
    const pointsFor = (status: ScoreStatus) => status === 'normal' ? 100 : status === 'warning' ? 70 : 40;
    const worstStatus = (statuses: ScoreStatus[]): ScoreStatus =>
      statuses.includes('danger') ? 'danger' : statuses.includes('warning') ? 'warning' : 'normal';
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    // Keep the daily average, but never let it hide a concerning individual reading.
    const heartRateStatus = (value: number, lowThreshold: number): ScoreStatus =>
      value < 40 || value >= 130 ? 'danger' : value < lowThreshold || value > 100 ? 'warning' : 'normal';
    const bloodPressureStatus = (systolic: number, diastolic: number, patientAge: number): ScoreStatus =>
      systolic >= 180 || diastolic >= 120
        ? 'danger'
        : systolic >= 140 || diastolic >= 90 ||
          (patientAge < 18 && (systolic >= 130 || diastolic >= 80)) ||
          systolic < 90 || diastolic < 60 ? 'warning' : 'normal';
    const glucoseStatus = (value: number, mealTiming: 'fasting' | 'after_meal'): ScoreStatus =>
      value < 0.54 ? 'danger' : value < 0.70 ||
        (mealTiming === 'fasting' && value >= 1.10) ||
        (mealTiming === 'after_meal' && value >= 2.0) ? 'warning' : 'normal';
    const details: { key: string; label: string; status: ScoreStatus; points: number; explanation: string; date: string; readings: any[] }[] = [];
    const addDetail = (key: string, label: string, status: ScoreStatus, explanation: string, date: string, readings: any[]) => {
      details.push({ key, label, status, points: pointsFor(status), explanation, date, readings });
    };
    const latestDate = (items: any[]) => items.reduce((latest, item) => {
      const currentTime = new Date(item.date).getTime();
      return !latest || currentTime > new Date(latest.date).getTime() ? item : latest;
    }, null as any)?.date || now.toISOString();

    const heartReadings = (todayByType.heart_rate || []).filter((item) => Number.isFinite(item.value));
    if (heartReadings.length > 0 && age !== null && age >= 13) {
      const dailyAverage = average(heartReadings.map((item) => item.value));
      const lowThreshold = age < 18 ? 50 : 60;
      const averageStatus = heartRateStatus(dailyAverage, lowThreshold);
      const individualWorstStatus = worstStatus(heartReadings.map((item) => heartRateStatus(item.value, lowThreshold)));
      const status = worstStatus([averageStatus, individualWorstStatus]);
      const heartRateDeviation = (value: number) => value < lowThreshold ? lowThreshold - value : value > 100 ? value - 100 : 0;
      const worstReading = heartReadings.reduce((worst, item) => {
        const currentStatus = heartRateStatus(item.value, lowThreshold);
        if (!worst) return item;
        const worstStatusForReading = heartRateStatus(worst.value, lowThreshold);
        return pointsFor(currentStatus) < pointsFor(worstStatusForReading) ||
          (currentStatus === worstStatusForReading && heartRateDeviation(item.value) > heartRateDeviation(worst.value)) ? item : worst;
      }, null as any);
      const individualNote = individualWorstStatus !== 'normal' && worstReading
        ? ` Une mesure individuelle de ${worstReading.value} bpm a aussi été prise en compte.` : '';
      addDetail(
        'heart_rate',
        'Fréquence cardiaque',
        status,
        `Moyenne du jour : ${dailyAverage.toFixed(1)} bpm (${heartReadings.length} mesure${heartReadings.length > 1 ? 's' : ''}) — ${status === 'normal' ? 'dans la plage de référence utilisée' : status === 'warning' ? 'au moins une valeur est à surveiller' : 'au moins une valeur est très éloignée de la plage de référence'}.${individualNote}`,
        latestDate(heartReadings),
        [...heartReadings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    }

    const pressureReadings = (todayByType.blood_pressure || []).filter(
      (item) => Number.isFinite(item.systolic) && Number.isFinite(item.diastolic)
    );
    if (pressureReadings.length > 0 && age !== null && age >= 13) {
      const avgSystolic = average(pressureReadings.map((item) => item.systolic));
      const avgDiastolic = average(pressureReadings.map((item) => item.diastolic));
      const averageStatus = bloodPressureStatus(avgSystolic, avgDiastolic, age);
      const individualWorstStatus = worstStatus(pressureReadings.map((item) => bloodPressureStatus(item.systolic, item.diastolic, age)));
      const status = worstStatus([averageStatus, individualWorstStatus]);
      const worstReading = pressureReadings.reduce((worst, item) => {
        const currentStatus = bloodPressureStatus(item.systolic, item.diastolic, age);
        return !worst || pointsFor(currentStatus) < pointsFor(bloodPressureStatus(worst.systolic, worst.diastolic, age)) ? item : worst;
      }, null as any);
      const individualNote = individualWorstStatus !== 'normal' && worstReading
        ? ` Une mesure individuelle de ${worstReading.systolic}/${worstReading.diastolic} mmHg a aussi été prise en compte.` : '';
      addDetail(
        'blood_pressure',
        'Tension artérielle',
        status,
        `Moyenne du jour : ${avgSystolic.toFixed(0)}/${avgDiastolic.toFixed(0)} mmHg (${pressureReadings.length} mesure${pressureReadings.length > 1 ? 's' : ''}) — moyennes systolique et diastolique évaluées séparément.${individualNote}`,
        latestDate(pressureReadings),
        [...pressureReadings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    }

    // Do not mix fasting and post-meal glucose readings: evaluate each context's daily average.
    const glucoseReadings = (todayByType.blood_sugar || []).filter((item) => Number.isFinite(item.value));
    if (glucoseReadings.length > 0) {
      const glucoseContextResults: { context: string; mean: number; count: number; status: ScoreStatus }[] = [];
      (['fasting', 'after_meal'] as const).forEach((mealTiming) => {
        const contextReadings = glucoseReadings.filter((item) => item.mealTiming === mealTiming);
        if (contextReadings.length === 0) return;
        const mean = average(contextReadings.map((item) => item.value));
        const averageStatus = glucoseStatus(mean, mealTiming);
        const individualWorstStatus = worstStatus(contextReadings.map((item) => glucoseStatus(item.value, mealTiming)));
        const status = worstStatus([averageStatus, individualWorstStatus]);
        glucoseContextResults.push({
          context: mealTiming === 'fasting' ? 'à jeun' : 'après repas',
          mean,
          count: contextReadings.length,
          status,
        });
      });

      if (glucoseContextResults.length > 0) {
        // Use the most concerning context for the glucose contribution so one context cannot hide another.
        const status = worstStatus(glucoseContextResults.map((item) => item.status));
        const explanation = glucoseContextResults.map((item) =>
          `${item.context} : ${item.mean.toFixed(2)} g/L (${item.count} mesure${item.count > 1 ? 's' : ''})${item.status !== 'normal' ? ' — au moins une mesure individuelle nécessite une attention' : ''}`
        ).join(' ; ');
        addDetail(
          'blood_sugar',
          'Glycémie',
          status,
          `${explanation} — interprétation indicative ; les contextes ne sont pas mélangés.`,
          latestDate(glucoseReadings),
          [...glucoseReadings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      }
    }

    const weightReadings = (todayByType.weight || []).filter((item) => Number.isFinite(item.value));
    const weight = weightReadings.length > 0 ? weightReadings.reduce((latest, item) =>
      new Date(item.date).getTime() > new Date(latest.date).getTime() ? item : latest
    ) : null;
    const height = user?.height;
    if (weight && age !== null && age >= 18 && typeof height === 'number' && Number.isFinite(height) && height >= 100 && height <= 250) {
      const bmi = weight.value / Math.pow(height / 100, 2);
      const status: ScoreStatus = bmi >= 40 ? 'danger' : bmi >= 30 || bmi < 18.5 ? 'warning' : 'normal';
      addDetail('weight', 'IMC (indicateur)', status, `Dernier poids du jour : ${weight.value} kg — IMC estimé : ${bmi.toFixed(1)}.`, weight.date, [weight]);
    }

    const enoughData = todayMeasurements.length >= 3 && details.length >= 2;
    const score = enoughData && details.length > 0
      ? Math.round(details.reduce((sum, item) => sum + item.points, 0) / details.length)
      : null;
    const label = score === null ? 'Données insuffisantes' : score >= 85 ? 'Bon équilibre' : score >= 70 ? 'À surveiller' : score >= 50 ? 'Attention' : 'Critique';
    return { score, label, details, recentCount: todayMeasurements.length, indicatorCount: details.length, enoughData };
  }, [measurements, user?.dateOfBirth, user?.height, scoreDayKey]);

  const healthScore = scoreResult.score;
  const scoreLabel = scoreResult.label;
  const scoreColor = healthScore === null ? '#D6D9D6' : healthScore >= 85 ? '#7BE0A0' : healthScore >= 70 ? '#F2C35B' : '#FF8A85';

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
    {  icon: 'add' as const,  label: 'Mesure', color: colors.primaryDark, darkColor: '#293E30', darkIconColor: '#8CB990', onPress: () => router.push('/(tabs)/health'), },
    {  icon: 'chatbubbles-outline' as const, label: 'Assistant', color: '#4A7BEB', darkColor: '#263B60', darkIconColor: '#8FB5FF', onPress: () => router.push('/(tabs)/assistant'), },
    {  icon: 'calendar-outline' as const, label: 'Rendez-vous', color: '#E67E22', darkColor: '#54391F', darkIconColor: '#F5B66F', onPress: () => router.push('/(tabs)/appointments'), },
    {  icon: 'medkit-outline' as const, label: 'Médicaments', color: '#9B59B6', darkColor: '#493052', darkIconColor: '#C99AE0', onPress: () => router.push('/(tabs)/profile'), },
  ];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.bg }]} edges={['top']}>
      <LinearGradient colors={activeGradients.background} style={styles.flex}>
        <View style={[ styles.orb, {  top: -100,  right: -80,  width: 280,  height: 280,  backgroundColor: isDark  ? 'rgba(140,185,144,0.10)'  : 'rgba(255,255,255,0.55)',  }, ]}/>
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
              <Text style={[styles.hello, { color: palette.textMuted }]}>{greeting}</Text>
              <Text style={[styles.name, { color: palette.text }]}>{user?.name || 'Utilisateur'}</Text>
            </View>
            <TouchableOpacity style={[ styles.iconBtn, isDark && { backgroundColor: palette.surfaceSolid, borderWidth: 1, borderColor: palette.glassBorder, }, ]}  onPress={() => setShowNotifications(!showNotifications)}>
              <Ionicons name={showNotifications ? 'notifications' : 'notifications-outline'} size={22} color={palette.primary} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </AnimatedView>

          {showNotifications && (
            <AnimatedView animation="down" delay={0}>
              <View  style={[ styles.notifPanel, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
                <View style={styles.notifHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[ styles.notifPanelTitle, { color: palette.text }, ]}>
                      {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
                    </Text>
                    <Text style={[styles.notifPanelSubtitle, { color: palette.textMuted }]}>Alertes et rappels</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowNotifications(false)} style={[ styles.notifClose, isDark && { backgroundColor: palette.surfaceSolid }, ]}>
                    <Ionicons name="close" size={18} color={palette.textMuted} />
                  </TouchableOpacity>
                </View>

                {allNotifications.length === 0 ? (
                  <View style={styles.notifEmpty}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    <Text style={styles.notifEmptyText}>Aucune notification pour l'instant.</Text>
                  </View>
                ) : (
                  allNotifications.slice(0, 3).map((notif, idx) => {
                    const isRead = notif.read;
                    const iconName = notif.type === 'alert' ? 'warning'
                      : notif.type === 'appointment' ? 'calendar'
                      : notif.type === 'medication' ? 'medkit'
                      : 'information-circle';
                    const iconColor = notif.type === 'alert'
                      ? notif.level === 'danger' ? '#D9534F' : '#E6A23C'
                      : notif.type === 'medication' ? '#4F83CC'
                      : notif.type === 'appointment' ? '#65A77A'
                      : '#4F83CC';
                    const iconBackground = notif.type === 'alert'
                      ? notif.level === 'danger' ? '#FCE8E8' : '#FFF3E0'
                      : notif.type === 'medication' ? '#E8F0FC'
                      : notif.type === 'appointment' ? '#E8F5E9'
                      : '#E8F0FC';
                    return (
                      <TouchableOpacity
                        key={notif._id}
                        style={[
                          styles.notifItem,
                          {
                            borderLeftColor: iconColor,
                            backgroundColor: isDark ? palette.surfaceSolid : '#F8FAF9',
                          },
                        ]}
                        onPress={() => {
                          if (notif.type === 'alert') {
                            markHealthAlertRead(notif._id);
                          } else {
                            markAsRead(notif._id);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.notifItemIcon, { backgroundColor: iconBackground }]}>
                          <Ionicons name={iconName} size={16} color={iconColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.notifItemTitle, { color: isDark ? '#F0F5F0' : palette.text }, !isRead && { fontWeight: '800' }, ]}>{notif.title}</Text>
                          <Text style={[styles.notifItemSub, { color: isDark ? '#C5D2C6' : palette.textMuted }]} numberOfLines={1}  ellipsizeMode="tail"> {notif.message}</Text>
                          <Text style={{ ...typography.caption, color: isDark ? '#AABDAE' : palette.textMuted, fontSize: 11, marginTop: 3 }}>{timeAgo(notif.createdAt)}</Text>
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

                <View style={{  marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        markAllAsRead();
                        healthAlerts.forEach(alert => {
                          if (!alert.read) {
                            markHealthAlertRead(alert._id);
                          }
                        });
                      }}
                      style={{ paddingVertical: 8 }}
                    >
                      <Text style={[styles.notifSeeAllText, { color: palette.primary }]}>
                        Tout lire
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => { setShowNotifications(false); 
                      router.push('/alerts');
                    }}
                    style={{ paddingVertical: 8 }}
                  >
                    <Text style={[styles.notifSeeAllText, { color: palette.primary }]}>
                      Voir toutes les notifications
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AnimatedView>
          )}

          <AnimatedView delay={200} animation="down">
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/assistant')} style={[ styles.search, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <TextInput style={styles.searchInput} placeholder="Posez une question sur votre santé" placeholderTextColor={colors.textMuted} editable={false} pointerEvents="none" />
              <LinearGradient colors={activeGradients.primary} style={styles.mic}><Ionicons name="mic" size={18} color="#fff" /></LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          <AnimatedView delay={230} animation="up">
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/urgency')} activeOpacity={0.9}>
              <LinearGradient colors={['#E53E3E', '#C53030']} style={styles.emergencyGradient}>
                <Ionicons name="alert-circle" size={20} color="#FFF" />
                <Text style={styles.emergencyText}>URGENCE</Text>
                <Ionicons name="call" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          <AnimatedView delay={280} animation="up" style={styles.quickRow}>
            {quickActions.map((q) => (
              <TouchableOpacity key={q.label} activeOpacity={0.85} onPress={q.onPress} style={styles.quickItem} >
                <View style={[ styles.quickIcon, { backgroundColor: isDark ? q.darkColor : q.color, }, isDark && { borderWidth: 1, borderColor: palette.glassBorder, }, ]}>
                  <Ionicons name={q.icon} size={24} color={isDark ? q.darkIconColor : '#fff'}/>
                </View>
                <Text style={[styles.quickLabel, { color: palette.text }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </AnimatedView>

          <AnimatedView delay={360} animation="zoom" style={{ marginTop: spacing.lg }}>
            <LinearGradient   colors={activeGradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, shadows.strong]}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View style={[styles.ring, { borderColor: scoreColor }]}>
                  <Text style={styles.ringValue}>{healthScore === null ? '—' : healthScore}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 18 }}>
                  <Text style={styles.heroKicker}>SCORE SANTÉ</Text>
                  <Text style={styles.heroTitle}>{scoreLabel}</Text>
                  <Text style={styles.liveText}>{scoreResult.recentCount} mesures aujourd'hui · {scoreResult.indicatorCount} indicateurs évalués</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.85} style={styles.heroBtn} onPress={() => setShowScoreDetails(true)}>
                <Text style={styles.heroBtnText}>Comprendre mon score</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
              </TouchableOpacity>
            </LinearGradient>
          </AnimatedView>

          <Modal visible={showScoreDetails} transparent animationType="fade" onRequestClose={() => setShowScoreDetails(false)}>
            <View style={styles.scoreModalBackdrop}>
              <ScrollView
                style={[styles.scoreModal, { backgroundColor: isDark ? palette.surface : '#FFFFFF' }]}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.scoreModalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scoreModalTitle, { color: palette.text }]}>Comprendre mon score</Text>
                    <Text style={[styles.scoreModalSubtitle, { color: palette.textMuted }]}>Indicateur informatif basé sur l'ensemble de vos mesures d'aujourd'hui.</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowScoreDetails(false)} style={styles.scoreClose}>
                    <Ionicons name="close" size={20} color={palette.text} />
                  </TouchableOpacity>
                </View>

                {healthScore === null ? (
                  <View style={styles.scoreInfoBox}>
                    <Ionicons name="information-circle-outline" size={22} color={palette.primary} />
                    <Text style={[styles.scoreInfoText, { color: palette.text }]}>Ajoutez au moins 3 mesures aujourd'hui couvrant 2 indicateurs différents. Certaines évaluations nécessitent aussi votre date de naissance ou votre taille.</Text>
                  </View>
                ) : (
                  <View style={styles.scoreSummary}>
                    <Text style={styles.scoreSummaryNumber}>{healthScore}/100</Text>
                    <Text style={styles.scoreSummaryLabel}>{scoreLabel}</Text>
                  </View>
                )}

                <Text style={[styles.scoreSectionTitle, { color: palette.text }]}>Détail des indicateurs</Text>
                {scoreResult.details.length === 0 ? (
                  <Text style={[styles.scoreEmpty, { color: palette.textMuted }]}>Aucun indicateur ne peut encore être évalué avec les informations disponibles.</Text>
                ) : scoreResult.details.map((item) => {
                  const isExpanded = expandedScoreDetails === item.key;
                  return (
                    <View key={item.key} style={[styles.scoreDetailContainer, { borderColor: palette.glassBorder }]}>
                      <View style={styles.scoreDetailRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.scoreDetailTitle, { color: palette.text }]}>{item.label}</Text>
                          <Text style={[styles.scoreDetailText, { color: palette.textMuted }]}>{item.explanation}</Text>
                        </View>
                        <View style={[styles.scoreStatus, { backgroundColor: item.status === 'normal' ? '#DDF3E4' : item.status === 'warning' ? '#FFF0CC' : '#FCE0E0' }]}>
                          <Text style={{ color: item.status === 'normal' ? '#287A45' : item.status === 'warning' ? '#946200' : '#B83232', fontWeight: '800', fontSize: 11 }}>{item.points}/100</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.scoreReadingsToggle}
                        onPress={() => setExpandedScoreDetails(isExpanded ? null : item.key)}
                      >
                        <Text style={[styles.scoreReadingsToggleText, { color: palette.primary }]}>
                          {isExpanded ? 'Masquer les mesures' : 'Voir les mesures utilisées'}
                        </Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={15} color={palette.primary} />
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={[styles.scoreReadingsList, { backgroundColor: isDark ? palette.surfaceSolid : '#F5F8F5' }]}>
                          {item.readings.map((reading: any, index: number) => {
                            const time = new Date(reading.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            let readingValue = item.key === 'blood_pressure'
                              ? `${reading.systolic}/${reading.diastolic} mmHg`
                              : item.key === 'heart_rate'
                                ? `${reading.value} bpm`
                                : item.key === 'blood_sugar'
                                  ? `${reading.value} g/L`
                                  : `${reading.value} kg`;
                            const context = item.key === 'blood_sugar'
                              ? reading.mealTiming === 'fasting' ? 'À jeun' : reading.mealTiming === 'after_meal' ? 'Après repas' : 'Contexte non précisé'
                              : null;
                            return (
                              <View key={`${item.key}-${reading._id || index}`} style={styles.scoreReadingItem}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.scoreReadingValue, { color: palette.text }]}>{readingValue}</Text>
                                  {context && <Text style={[styles.scoreReadingContext, { color: palette.textMuted }]}>{context}</Text>}
                                </View>
                                <Text style={[styles.scoreReadingTime, { color: palette.textMuted }]}>{time}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}

                <Text style={[styles.scoreDisclaimer, { color: palette.textMuted }]}>Le score utilise les moyennes des mesures du jour pour la fréquence cardiaque et la tension, tout en tenant compte de la mesure individuelle la plus préoccupante afin qu'une moyenne normale ne masque pas une valeur anormale. Pour la glycémie, les moyennes à jeun et après repas sont évaluées séparément, et les valeurs individuelles sont également prises en compte ; le résultat le plus préoccupant détermine les points de cet indicateur. Le poids utilise la dernière mesure du jour. Chaque indicateur reçoit 100 points (plage de référence), 70 points (à surveiller) ou 40 points (valeur très éloignée). Le score est la moyenne des indicateurs disponibles. Il ne constitue pas un diagnostic médical et ne remplace jamais les alertes individuelles.</Text>
                <TouchableOpacity style={styles.scoreDoneButton} onPress={() => setShowScoreDetails(false)}>
                  <Text style={styles.scoreDoneText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Modal>

          <AnimatedView delay={400} animation="up" style={styles.tipCard}>
            <LinearGradient colors={ isDark  ? ['#b98525', '#996b15']  : ['#f5d142', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipGradient}>
              <View style={styles.tipIcon}><Ionicons name="bulb" size={24} color="#FFF" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.tipLabel}>CONSEIL DU JOUR</Text>
                <Text style={styles.tipText}>{dailyTip}</Text>
              </View>
            </LinearGradient>
          </AnimatedView>

          <AnimatedView delay={420} animation="up" style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text }]}>Mes dernières mesures</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/health')}><Text style={[styles.seeAll, { color: palette.primary }]}>Voir tout</Text></TouchableOpacity>
          </AnimatedView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList} style={styles.hBleed}>
            {Object.keys(METRICS).map((key, idx) => {
              const c = METRICS[key];
              const m = latestMeasures[key];
              const isAlert = false;
              const chartData = chartDataByType[key] || [];

              return (
                <AnimatedView key={key} delay={460 + idx * 70} animation="zoom">
                  <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/health')} style={{ width: 180 }}>
                    <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.glass, styles.metricCard, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, },]}>
                      <View style={styles.metricHead}>
                        <View style={[styles.chip, { backgroundColor: isDark ? palette.primarySoft : c.soft, }]}><Ionicons name={c.icon} size={16} color={c.color} /></View>
                        {isAlert && <Ionicons name="warning" size={16} color="#E67E22" />}
                      </View>
                      <Text style={[styles.metricLabel, { color: palette.textMuted }]}>{c.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text
                          style={[styles.metricValue, { color: palette.text }, key === 'blood_pressure' && { fontSize: 20 }, isAlert && { color: '#E67E22' }, ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {m
                            ? key === 'blood_pressure'
                              ? `${m.systolic ?? '--'}/${m.diastolic ?? '--'}`
                              : m.value
                            : '—'}
                        </Text>
                        <Text style={[styles.metricUnit, { color: palette.textMuted }]}> {c.unit}</Text>
                      </View>
                      {chartData.length > 1 && (
                        <View style={styles.metricChart}>
                          <LineChart data={chartData} width={130} height={30} color={c.color} thickness={2} hideDataPoints hideYAxisText hideAxesAndRules curved initialSpacing={0} spacing={18}/>
                        </View>
                      )}
                      <Text style={[styles.metricDate, { color: palette.textMuted }]}>{m ? timeAgo(m.date) : 'Aucune donnée'}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </AnimatedView>
              );
            })}
          </ScrollView>

          <AnimatedView delay={700} animation="up" style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text }]}>Prochain rendez-vous</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}><Text style={[styles.seeAll, { color: palette.primary }]}>Gérer</Text></TouchableOpacity>
          </AnimatedView>

          {nextAppointment ? (
            <AnimatedView delay={750} animation="zoom">
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')} activeOpacity={0.9}>
                <BlurView intensity={isDark ? 20 : 50}  tint={isDark ? 'dark' : 'light'}  style={[ styles.apptCard, isDark && { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.glassBorder, }, ]}>
                  <View style={[styles.apptDate, { backgroundColor: palette.primarySoft }, ]}>
                    <Text style={[styles.apptDay, { color: palette.primary }]}>{new Date(nextAppointment.date).getDate()}</Text>
                    <Text style={[styles.apptMonth, { color: palette.primary }]}>{new Date(nextAppointment.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.apptSpecialty, { color: palette.textMuted }]}>{nextAppointment.specialty}</Text>
                    <Text style={[styles.apptDoctor, { color: palette.text }]}>{nextAppointment.doctor}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Ionicons  name="time-outline" size={14} color={palette.textMuted}  />
                      <Text style={[styles.apptTime, { color: palette.textMuted }]}>{new Date(nextAppointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
                </BlurView>
              </TouchableOpacity>
            </AnimatedView>
          ) : (
            <AnimatedView delay={750} animation="fade">
              <View style={[ styles.emptyCard, isDark && { backgroundColor: palette.surface }, ]}><Ionicons name="calendar-outline" size={28} color={palette.textMuted} /><Text style={[styles.emptyText, { color: palette.textMuted }]}>Aucun rendez-vous prévu</Text></View>
            </AnimatedView>
          )}

          <AnimatedView delay={800} animation="up" style={styles.sectionRow}>
            <Text style={[styles.section, { color: palette.text }]}>Médicaments du jour</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}><Text style={[styles.seeAll, { color: palette.primary }]}>Gérer</Text></TouchableOpacity>
          </AnimatedView>

          {todaysMeds.length > 0 ? (
            <AnimatedView delay={850} animation="zoom">
              <BlurView intensity={isDark ? 20 : 50} tint={isDark ? 'dark' : 'light'}  style={[ styles.medsCard, isDark && { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.glassBorder, }, ]}>
                {todaysMeds.map((med: any, idx: number) => (
                  <View key={med._id} style={[ styles.medRow, idx > 0 && {  borderTopWidth: 1,  borderTopColor: isDark  ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.05)', }, ]}>
                    <View style={styles.medIcon}><Ionicons name="medkit" size={18} color="#4F83E8" /></View>
                
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.medName, { color: palette.text }]}>{med.name}</Text>
                      <Text style={[styles.medInfo, { color: palette.textMuted }]}>{med.dosage} · {med.times.join(', ')}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.medCheck, med.takenToday && styles.medCheckDone]}
                      onPress={() => markTaken?.(med._id, med.times[0], med.takenToday ? 'missed' : 'taken')}
                    >
                      {med.takenToday && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </TouchableOpacity>
                  </View>
                ))}
              </BlurView>
            </AnimatedView>
          ) : (
            <AnimatedView delay={850} animation="fade">
              <View style={[ styles.emptyCard, isDark && { backgroundColor: palette.surface }, ]}><Ionicons name="medkit-outline" size={28} color={palette.textMuted} /><Text style={[styles.emptyText, { color: palette.textMuted }]}>Aucun médicament aujourd'hui</Text></View>
            </AnimatedView>
          )}

          <Text style={[styles.disclaimer, { color: palette.textMuted }]}>
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
  
  metricCard: {  padding: spacing.md,  height: 180,},
  metricHead: {  flexDirection: 'row',  justifyContent: 'space-between',  alignItems: 'center',},
  metricLabel: {  ...typography.caption,  color: colors.textMuted,  marginTop: 8,},
  metricValue: {  fontSize: 26,  fontWeight: '800',  color: colors.primaryDeeper,  letterSpacing: -0.6,},
  metricUnit: {  fontSize: 12,  color: colors.textMuted,  fontWeight: '600',},
  metricChart: {  marginLeft: -12,  marginTop: 3,  height: 30,},
  metricDate: {  ...typography.caption,  color: colors.textMuted, marginTop: 2,},

  apptCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft },
  apptDate: { width: 56, height: 64, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  apptDay: { fontSize: 22, fontWeight: '800', color: colors.primaryDark },
  apptMonth: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  apptSpecialty: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  apptDoctor: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper, marginTop: 2 },
  apptTime: { ...typography.caption, color: colors.textMuted },

  medsCard: { borderRadius: radius.lg, padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  medIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FF', alignItems: 'center', justifyContent: 'center' },
  medName: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper },
  medInfo: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  medCheck: { width: 22, height: 22, borderRadius: 16, borderWidth: 2, borderColor: "#4f82e877", alignItems: 'center', justifyContent: 'center' },
  medCheckDone: { backgroundColor: "#4F83E8", borderColor: "#4F83E8" },

  emptyCard: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.5)', gap: 8 },
  emptyText: { ...typography.body, color: colors.textMuted },

  scoreModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  scoreModal: { borderRadius: 24, padding: 20, maxHeight: '88%' },
  scoreModalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  scoreModalTitle: { fontSize: 20, fontWeight: '800' },
  scoreModalSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  scoreClose: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(120,130,120,0.12)' },
  scoreSummary: { backgroundColor: '#315D43', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  scoreSummaryNumber: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  scoreSummaryLabel: { color: '#DDEBE0', fontSize: 13, fontWeight: '700', marginTop: 2 },
  scoreInfoBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'rgba(100,140,110,0.12)', borderRadius: 14, padding: 12, marginBottom: 16 },
  scoreInfoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  scoreSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  scoreDetailContainer: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  scoreDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreReadingsToggle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingTop: 8, paddingBottom: 2 },
  scoreReadingsToggleText: { fontSize: 11, fontWeight: '700' },
  scoreReadingsList: { borderRadius: 10, paddingHorizontal: 10, marginTop: 8 },
  scoreReadingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(120,130,120,0.18)' },
  scoreReadingValue: { fontSize: 12, fontWeight: '700' },
  scoreReadingContext: { fontSize: 10, marginTop: 2 },
  scoreReadingTime: { fontSize: 11, marginLeft: 8 },
  scoreDetailTitle: { fontSize: 13, fontWeight: '700' },
  scoreDetailText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  scoreStatus: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  scoreEmpty: { fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  scoreDisclaimer: { fontSize: 10, lineHeight: 15, marginTop: 14 },
  scoreDoneButton: { backgroundColor: '#315D43', borderRadius: 22, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  scoreDoneText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disclaimer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.xl, paddingHorizontal: spacing.md },
});