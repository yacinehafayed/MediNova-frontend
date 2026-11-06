import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAppointmentsStore } from '@/store/appointments.store';
import { useMedicationsStore } from '@/store/medications.store';

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function CalendarModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { appointments, loadAppointments } = useAppointmentsStore();
  const { medications, loadMedications } = useMedicationsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (visible) {
      loadAppointments();
      loadMedications();
    }
  }, [visible]);


  const eventsByDay: Record<string, { type: 'appointment' | 'medication'; title: string; time: string; color: string }[]> = {};

  appointments.forEach(a => {
    const date = new Date(a.date);
    const key = date.toDateString();
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push({
      type: 'appointment',
      title: `${a.doctor} (${a.specialty})`,
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      color: colors.primary,
    });
  });

  medications.forEach(m => {
    if (!m.times) return;
    const start = new Date(m.startDate);
    const end = new Date(m.endDate);
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toDateString();
      if (!eventsByDay[key]) eventsByDay[key] = [];
      m.times.forEach(t => {
        eventsByDay[key].push({
          type: 'medication',
          title: m.name,
          time: t,
          color: '#4A7BEB',
        });
      });
      cur.setDate(cur.getDate() + 1);
    }
  });


  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const goToPrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const today = new Date().toDateString();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryDeeper} />
          </TouchableOpacity>
          <Text style={styles.title}>Calendrier</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>


          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primaryDeeper} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={24} color={colors.primaryDeeper} />
            </TouchableOpacity>
          </View>


          <View style={styles.weekRow}>
            {DAYS_SHORT.map(d => (
              <Text key={d} style={styles.weekDay}>{d}</Text>
            ))}
          </View>


          <BlurView intensity={40} tint="light" style={styles.calendar}>
            <View style={styles.daysGrid}>
              {days.map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.dayCell} />;
                const key = day.toDateString();
                const events = eventsByDay[key] || [];
                const isToday = key === today;
                const hasEvents = events.length > 0;

                return (
                  <View key={key} style={styles.dayCell}>
                    <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
                      <Text style={[styles.dayText, isToday && { color: '#FFF' }]}>{day.getDate()}</Text>
                    </View>
                    {hasEvents && (
                      <View style={styles.dotRow}>
                        {events.slice(0, 3).map((e, idx) => (
                          <View key={idx} style={[styles.eventDot, { backgroundColor: e.color }]} />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </BlurView>


          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Rendez-vous</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4A7BEB' }]} />
              <Text style={styles.legendText}>Médicaments</Text>
            </View>
          </View>


          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          {eventsByDay[today]?.length === 0 || !eventsByDay[today] ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun événement aujourd'hui.</Text>
            </View>
          ) : (
            eventsByDay[today].map((event, idx) => (
              <BlurView key={idx} intensity={50} tint="light" style={styles.eventCard}>
                <View style={[styles.eventIcon, { backgroundColor: event.color + '22' }]}>
                  <Ionicons name={event.type === 'appointment' ? 'calendar' : 'medkit'} size={18} color={event.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
              </BlurView>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: colors.primaryDeeper },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  arrowBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper },

  weekRow: { flexDirection: 'row', marginBottom: spacing.sm },
  weekDay: { flex: 1, textAlign: 'center', ...typography.caption, fontWeight: '700', color: colors.textMuted },

  calendar: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.7)', ...shadows.soft, marginBottom: spacing.md },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: colors.primaryDark },
  dayText: { ...typography.body, color: colors.primaryDeeper, fontWeight: '600' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventDot: { width: 4, height: 4, borderRadius: 2 },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.textMuted },

  sectionTitle: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, marginBottom: spacing.md },

  eventCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm, ...shadows.soft },
  eventIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { ...typography.body, fontWeight: '700', color: colors.primaryDeeper },
  eventTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  emptyCard: { borderRadius: radius.lg, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
});