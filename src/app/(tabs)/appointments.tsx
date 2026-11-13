import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert as RNAlert, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AnimatedView from '@/components/AnimatedView';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAppointmentsStore } from '@/store/appointments.store';
import { useThemeStore } from '@/store/theme.store';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const SPECIALTIES = ['Cardiologie', 'Dermatologie', 'Généraliste', 'Pédiatrie'];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

export default function Appointments() {
  const store = useAppointmentsStore();
  const isDark = useThemeStore((s) => s.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;


  const appointments = store.appointments || [];
  const addAppointment = store.addAppointment;
  const deleteAppointment = store.deleteAppointment;
  const loadAppointments = store.loadAppointments;

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const [doctor, setDoctor] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('14:30');

  const next7Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime());
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  useEffect(() => { loadAppointments(); }, []);

  const handleAdd = async () => {
    if (!doctor.trim()) return RNAlert.alert('Erreur', 'Veuillez entrer le nom du médecin.');
    if (!location.trim()) return RNAlert.alert('Erreur', 'Veuillez entrer le lieu du rendez-vous.');

    const date = new Date(selectedDate.getTime());
    const [hours, minutes] = selectedTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    const result = await addAppointment({
      doctor: `Dr. ${doctor.trim()}`,
      specialty,
      date: date.toISOString(),
      location: location.trim(),
      mode: 'cabinet',
    });

    if (result.success) {
      setDoctor('');
      setLocation('');
      setSelectedDate(new Date());
      setSelectedTime('14:30');
      setModalVisible(false);
      RNAlert.alert('Succès', 'Rendez-vous ajouté avec succès.');
    } else {
      RNAlert.alert('Erreur', result.message || 'Impossible d\'ajouter le rendez-vous.');
    }
  };

  const now = Date.now();
  const upcoming = appointments
    .filter(a => new Date(a.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = appointments.filter(a => new Date(a.date).getTime() < now);
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.bg }]} edges={['top']}>
    <LinearGradient colors={activeGradients.background} style={styles.flex}>
      <View style={[ styles.orb, { bottom: -100, right: -80, width: 280, height: 280, backgroundColor: isDark  ? 'rgba(140,185,144,0.10)'  : 'rgba(255,255,255,0.55)', }, ]}/>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <AnimatedView delay={100} animation="down" style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Mon agenda</Text>
              <Text style={[styles.headerTitle, { color: palette.text }]}>Rendez-vous</Text>
            </View>
            <TouchableOpacity style={[ styles.addBtn, isDark && { backgroundColor: palette.primary }, ]} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </AnimatedView>

          <AnimatedView delay={300} animation="up" style={[ styles.tabsContainer, ...(isDark ? [{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.glassBorder, }] : []), ]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && { backgroundColor: palette.primaryDark, ...shadows.soft, },]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabText,  { color: activeTab === 'upcoming' ? '#FFFFFF' : palette.textMuted },]}>
                À venir ({upcoming.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && { backgroundColor: palette.primaryDark, ...shadows.soft, },]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'past' ? '#FFFFFF' : palette.textMuted, },]}>
                Passés ({past.length})
              </Text>
            </TouchableOpacity>
          </AnimatedView>

          {displayed.length === 0 ? (
            <AnimatedView delay={400} animation="fade" style={styles.emptyContainer}>
              <View style={[ styles.emptyIcon, isDark && { backgroundColor: palette.surface }, ]}>
                <Ionicons name="calendar-outline" size={40} color={palette.primary} />
              </View>
              <Text style={[styles.emptyText, { color: palette.text }]}>Aucun rendez-vous {activeTab === 'upcoming' ? 'à venir' : 'passé'}.</Text>
              <Text style={[styles.emptySub, { color: palette.textMuted }]}>Cliquez sur '+' pour planifier une consultation.</Text>
            </AnimatedView>
          ) : (
            displayed.map((a, index) => {
              const dateObj = new Date(a.date);
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();

              return (
                <AnimatedView key={a._id} delay={400 + index * 80} animation="zoom">
                  <BlurView intensity={isDark ? 20 : 50} tint={isDark ? 'dark' : 'light'} style={[ styles.apptCard, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
                    <View style={styles.cardTop}>
                      <View style={[styles.dateBlock, { backgroundColor: palette.primarySoft },]}>
                        <Text style={[styles.dateDay, { color: palette.primary }]}>{dateObj.getDate()}</Text>
                        <Text style={[styles.dateMonth, { color: palette.primary }]}>{DAYS[dateObj.getDay()].toUpperCase()}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <View style={styles.badgeRow}>
                          <View style={styles.specBadge}>
                            <Text style={styles.specText}>{a.specialty}</Text>
                          </View>
                          {(isToday || isTomorrow) && (
                            <View style={styles.todayBadge}>
                              <Text style={styles.todayText}>{isToday ? "Aujourd'hui" : 'Demain'}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.doctorName, { color: palette.text }]}>{a.doctor}</Text>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={14} color={palette.textMuted} />
                          <Text style={[styles.timeText, { color: palette.textMuted }]}>
                            {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => deleteAppointment(a._id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.cardBottom, isDark && { borderTopColor: 'rgba(255,255,255,0.10)', },]}>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={palette.primary} />
                        <Text style={[styles.locationText, { color: palette.textMuted }]}>{a.location}</Text>
                      </View>
                    </View>
                  </BlurView>
                </AnimatedView>
              );
            })
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[ styles.modalContent, isDark && { backgroundColor: palette.surfaceSolid }, ]}>
                <Text style={[styles.modalTitle, { color: palette.text }]}>Nouveau rendez-vous</Text>
                <Text style={styles.inputLabel}>Nom du médecin</Text>
                <View style={[ styles.inputWrap, isDark && { backgroundColor: palette.bgDeep, borderColor: palette.glassBorder, }, ]}>
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" />
                  <TextInput
                    style={[styles.input, { color: palette.text }]}
                    placeholder="Ex: Sarah Lee"
                    placeholderTextColor={palette.textMuted}
                    value={doctor}
                    onChangeText={setDoctor}
                  />
                </View>

                <Text style={styles.inputLabel}>Lieu</Text>
                <View style={[ styles.inputWrap, isDark && { backgroundColor: palette.bgDeep, borderColor: palette.glassBorder, }, ]}>
                  <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.6)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Clinique du Parc"
                    placeholderTextColor={palette.textMuted}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                <Text style={styles.inputLabel}>Spécialité</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specRow}>
                  {SPECIALTIES.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[ styles.specChip, isDark && { backgroundColor: palette.bgDeep, borderWidth: 1, borderColor: palette.glassBorder, }, specialty === s && { backgroundColor: palette.primary },]}
                      onPress={() => setSpecialty(s)}
                    >
                      <Text style={[styles.specChipText, { color: isDark ? palette.text : '#FFFFFF' }, specialty === s && { color: '#FFFFFF' },]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                  {next7Days.map((d, index) => {
                    if (!(d instanceof Date) || isNaN(d.getTime())) return null;

                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                    const label = index === 0 ? "Auj." : index === 1 ? "Dem." : DAYS[d.getDay()];

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[ styles.dateChip, isDark && { backgroundColor: palette.bgDeep, borderWidth: 1, borderColor: palette.glassBorder, }, isSelected && { backgroundColor: palette.primary },]}
                        onPress={() => setSelectedDate(d)}
                      >
                        <Text style={[styles.dateChipDay, { color: isDark ? palette.textMuted : 'rgba(255,255,255,0.6)' }, isSelected && { color: '#FFFFFF' },]}>{label}</Text>
                        <Text style={[styles.dateChipNum, { color: palette.text }, isSelected && { color: '#FFFFFF' },]}>{d.getDate()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Heure</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                  {TIME_SLOTS.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[ styles.timeChip, isDark && { backgroundColor: palette.bgDeep, borderWidth: 1, borderColor: palette.glassBorder, }, isSelected && { backgroundColor: palette.primary },]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[styles.timeChipText, { color: palette.text }, isSelected && { color: '#FFFFFF' },]}>{time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity style={styles.modalBtn} onPress={handleAdd}>
                  <LinearGradient colors={activeGradients.primary} style={styles.modalBtnInner}>
                    <Text style={styles.modalBtnText}>Confirmer</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                  <Text style={[ styles.modalCloseText, { color: isDark ? palette.textMuted : 'rgba(255,255,255,0.6)' }, ]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: 20, paddingBottom: 160 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  headerSubtitle: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { ...typography.display, color: colors.primaryDeeper },
  addBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', ...shadows.strong },

  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: radius.pill, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.primaryDark, ...shadows.soft },
  tabText: { ...typography.body, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#FFF' },

  apptCard: { borderRadius: radius.xl, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#FFF', ...shadows.soft, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  dateBlock: { width: 60, height: 70, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  dateMonth: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  specBadge: { backgroundColor: 'rgba(198,161,91,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  specText: { ...typography.caption, color: colors.accent, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  todayBadge: { backgroundColor: 'rgba(217,83,79,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  todayText: { ...typography.caption, color: colors.danger, fontWeight: '700', fontSize: 10 },
  doctorName: { fontSize: 18, fontWeight: '800', color: colors.primaryDeeper, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(217,83,79,0.08)', alignItems: 'center', justifyContent: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { ...typography.caption, color: colors.textMuted },

  emptyContainer: { alignItems: 'center', marginTop: spacing.xxl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.soft },
  emptyText: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper },
  emptySub: { ...typography.body, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.primaryDeeper, padding: spacing.xl, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
  modalTitle: { ...typography.title, color: '#FFF', marginBottom: spacing.lg },
  inputLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, paddingHorizontal: spacing.md, height: 56, marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, fontSize: 15, color: '#FFF' },
  specRow: { gap: 8, paddingBottom: spacing.lg },
  specChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)' },
  specChipActive: { backgroundColor: colors.primary },
  specChipText: { ...typography.caption, color: '#FFF', fontWeight: '600' },

  dateRow: { gap: 10, paddingBottom: spacing.lg },
  dateChip: { width: 56, height: 70, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  dateChipActive: { backgroundColor: colors.primary, ...shadows.strong },
  dateChipDay: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  dateChipNum: { fontSize: 20, fontWeight: '800', color: '#FFF' },

  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timeChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)'
  },

  modalBtn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  modalBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalClose: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  modalCloseText: { color: 'rgba(255,255,255,0.6)', ...typography.body },
});