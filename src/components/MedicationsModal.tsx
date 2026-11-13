
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/theme.store';
import { useMedicationsStore } from '@/store/medications.store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MedicationsModal({ visible, onClose }: Props) {
  const store = useMedicationsStore();
  const isDark = useThemeStore((state) => state.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;

  const { medications, loadMedications, addMedication, markTaken, deleteMedication } = store;

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>(['08:00']);

  const days = [
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mer', value: 3 },
    { label: 'Jeu', value: 4 },
    { label: 'Ven', value: 5 },
    { label: 'Sam', value: 6 },
    { label: 'Dim', value: 0 },
  ];

  const dayLabels: Record<number, string> = {
    0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam',
  };

  const toggleDay = (day: number) => {
    setSelectedDays((previous) =>
      previous.includes(day) ? previous.filter((d) => d !== day) : [...previous, day]
    );
  };

  const updateDoseCount = (count: number) => {
    setTimes((previous) => {
      if (count > previous.length) {
        return [...previous, ...Array(count - previous.length).fill('08:00')];
      }
      return previous.slice(0, count);
    });
  };

  const updateDoseTime = (index: number, value: string) => {
    setTimes((previous) => previous.map((time, i) => (i === index ? value : time)));
  };

  const openAddForm = () => {
    setName('');
    setDosage('');
    setTimes(['08:00']);
    setSelectedDays([]);
    setShowForm(true);
  };

  useEffect(() => {
    if (visible) loadMedications();
  }, [visible]);

  const handleAdd = async () => {
    if (!name.trim() || !dosage.trim()) {
      return Alert.alert('Erreur', 'Nom et dosage requis.');
    }

    if (selectedDays.length === 0) {
      return Alert.alert('Erreur', 'Sélectionnez au moins un jour de prise.');
    }

    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (times.some((time) => !validTime.test(time))) {
      return Alert.alert('Erreur', 'Veuillez saisir des horaires valides au format HH:MM.');
    }

    if (new Set(times).size !== times.length) {
      return Alert.alert('Erreur', 'Chaque prise doit avoir un horaire différent.');
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const result = await addMedication({
      name: name.trim(),
      description: '',
      dosage: dosage.trim(),
      times,
      daysOfWeek: selectedDays,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    if (result.success) {
      setName('');
      setDosage('');
      setTimes(['08:00']);
      setSelectedDays([]);
      setShowForm(false);
    } else {
      Alert.alert('Erreur', result.message || 'Erreur');
    }
  };

  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => showForm ? setShowForm(false) : onClose()}>
      <View style={styles.container}>
        <LinearGradient colors={activeGradients.background} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.glassBorder, borderWidth: isDark ? 1 : 0 }]}>
            <Ionicons name="arrow-back" size={24} color={palette.primaryDeeper} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: palette.primaryDeeper }]}>Mes Médicaments</Text>

          <TouchableOpacity onPress={openAddForm} style={[styles.addBtn, { backgroundColor: palette.primaryDark }]}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Medication list */}
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {medications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={60} color={palette.textMuted} />
              <Text style={[styles.emptyText, { color: palette.primaryDeeper }]}>
                Aucun médicament enregistré
              </Text>
            </View>
          ) : (
            medications.map((med) => (
              <BlurView key={med._id} tint={isDark ? 'dark' : 'light'} intensity={isDark ? 35 : 60}
                style={[styles.card, { backgroundColor: palette.surface, borderWidth: isDark ? 1 : 0, borderColor: palette.glassBorder }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="medkit" size={22} color="#4F83E8" />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.medName, { color: palette.text }]}>{med.name}</Text>
                    <Text style={[styles.medDosage, { color: palette.primary }]}>{med.dosage}</Text>
                    <Text style={[styles.medDosage, { color: palette.textMuted }]}>
                      Jours : {med.daysOfWeek?.length === 7
                        ? 'Tous les jours'
                        : med.daysOfWeek?.length
                          ? med.daysOfWeek.map((day) => dayLabels[day]).join(', ')
                          : 'Non renseignés'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => deleteMedication(med._id)}>
                    <Ionicons name="trash-outline" size={20} color={palette.danger} />
                  </TouchableOpacity>
                </View>

                {/* Dose status chips */}
                <View style={[styles.timesRow, { borderTopColor: palette.glassBorder }]}>
                  {med.times.map((t, i) => {
                    const taken = med.taken?.some((r) => r.time === t && isToday(r.date));

                    return (
                      <TouchableOpacity key={i}
                        style={[styles.timeChip, { backgroundColor: taken ? palette.primary : isDark ? palette.surfaceSolid : 'rgba(94,127,99,0.1)', borderWidth: isDark && !taken ? 1 : 0, borderColor: palette.glassBorder }]}
                        onPress={() => markTaken(med._id, t, taken ? 'missed' : 'taken')}
                      >
                        <Ionicons name={taken ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={taken ? '#FFFFFF' : palette.primary} />
                        <Text style={[styles.timeText, { color: taken ? '#FFFFFF' : palette.text }]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </BlurView>
            ))
          )}
        </ScrollView>

        {/* Add medication bottom sheet */}
        {showForm && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowForm(false)} />
            <BlurView intensity={40} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.modalContent, isDark && { backgroundColor: palette.surfaceSolid },]}>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={[styles.modalTitle, { color: palette.text }]}>Nouveau médicament</Text>

                  {/* Medication name */}
                  <Text style={[styles.inputLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Nom du médicament</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      isDark && {
                        backgroundColor: palette.bgDeep,
                        borderColor: palette.glassBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="medkit-outline"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                    <TextInput
                      style={[styles.input, { color: palette.text }]}
                      placeholder="Ex: Doliprane"
                      placeholderTextColor={palette.textMuted}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  {/* Dosage */}
                  <Text style={[styles.inputLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Dosage</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      isDark && {
                        backgroundColor: palette.bgDeep,
                        borderColor: palette.glassBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="flask-outline"
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                    <TextInput
                      style={[styles.input, { color: palette.text }]}
                      placeholder="Ex: 500mg"
                      placeholderTextColor={palette.textMuted}
                      value={dosage}
                      onChangeText={setDosage}
                    />
                  </View>

                  {/* Days */}
                  <Text style={[styles.inputLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Jours de prise</Text>

                  <TouchableOpacity
                    onPress={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                    style={[ styles.everyDayButton, isDark && { backgroundColor: palette.bgDeep, borderWidth: 1, borderColor: palette.glassBorder,}, selectedDays.length === 7 && { backgroundColor: palette.primary,}, ]} >
                    <Text style={[ styles.everyDayText, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }, selectedDays.length === 7 && { color: '#FFFFFF' }, ]}>
                      Tous les jours
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.daysRow}>
                    {days.map((day) => {
                      const selected = selectedDays.includes(day.value);

                      return (
                        <TouchableOpacity key={day.value} onPress={() => toggleDay(day.value)}
                          style={[  styles.dayChip, isDark && {  backgroundColor: palette.bgDeep,  borderWidth: 1, borderColor: palette.glassBorder,}, selected && { backgroundColor: palette.primary },]}
                        >
                          <Text style={[styles.dayText, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' },  selected && { color: '#FFFFFF' },]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Dose count */}
                  <Text style={[styles.inputLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Nombre de prises par jour</Text>

                  <View style={styles.frequencyRow}>
                    <TouchableOpacity onPress={() => updateDoseCount(Math.max(1, times.length - 1))} disabled={times.length === 1}>
                      <Ionicons name="remove-circle" size={32} color={times.length === 1 ? 'rgba(255,255,255,0.3)' : '#8DB99A'} />
                    </TouchableOpacity>

                    <Text style={[styles.frequencyValue, { color: isDark ? palette.text : 'rgba(255, 255, 255, 0.8)' }]}>
                      {times.length} {times.length > 1 ? 'prises' : 'prise'}
                    </Text>

                    <TouchableOpacity onPress={() => updateDoseCount(Math.min(6, times.length + 1))} disabled={times.length === 6}>
                      <Ionicons name="add-circle" size={32} color={times.length === 6 ? 'rgba(255,255,255,0.3)' : '#8DB99A'} />
                    </TouchableOpacity>
                  </View>

                  {/* Dose times */}
                  <Text style={[styles.inputLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Horaires des prises</Text>

                  {times.map((doseTime, index) => (
                    <View key={index} style={styles.doseRow}>
                      <Text style={[styles.doseLabel, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}>Prise {index + 1}</Text>

                      <View
                        style={[
                          styles.timeInputWrapper,
                          isDark && {
                            backgroundColor: palette.bgDeep,
                            borderColor: palette.glassBorder,
                          },
                        ]}
                      >
                        <Ionicons name="time-outline" size={18} color={palette.primary} />
                        <TextInput
                          style={[styles.timeInput, { color: isDark ? palette.text : 'rgba(255,255,255,0.8)' }]}
                          value={doseTime}
                          onChangeText={(value) => updateDoseTime(index, value)}
                          placeholder="08:00"
                          placeholderTextColor={palette.text}
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  ))}

                  <Text style={[styles.formHint, { color: palette.textMuted }]}>Format des horaires : HH:MM (24 heures).</Text>

                  {/* Confirm */}
                  <TouchableOpacity style={styles.modalBtn} onPress={handleAdd}>
                    <LinearGradient colors={activeGradients.primary} style={styles.modalBtnInner}>
                      <Text style={styles.modalBtnText}>Confirmer</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalClose} onPress={() => setShowForm(false)}>
                    <Text style={styles.modalCloseText}>Annuler</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden', ...shadows.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 45, height: 45, borderRadius: 16, backgroundColor: '#E8F1FF', alignItems: 'center', justifyContent: 'center' },
  medName: { ...typography.subtitle, fontWeight: '800' },
  medDosage: { ...typography.caption, fontWeight: '600', marginTop: 2 },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingTop: spacing.md, borderTopWidth: 1 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  timeText: { ...typography.caption, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.subtitle, fontWeight: '700', marginTop: spacing.md },

  modalOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.primaryDeeper, padding: spacing.xl, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20, maxHeight: '90%' },  modalTitle: { ...typography.title, color: '#FFF', marginBottom: spacing.lg },
  inputLabel: { ...typography.caption, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, paddingHorizontal: spacing.md, height: 56, marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, fontSize: 15, color: '#FFF' },

  everyDayButton: { height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)' },
  everyDayText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5, marginBottom: spacing.lg },
  dayChip: { flex: 1, height: 42, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  dayText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

  frequencyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: spacing.lg },
  frequencyValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', minWidth: 80, textAlign: 'center' },

  doseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  doseLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  timeInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, paddingHorizontal: 12, width: 125, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  timeInput: { flex: 1, height: 46, marginLeft: 6, fontSize: 15, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  formHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2, marginBottom: spacing.sm },

  modalBtn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  modalBtnInner: { height: 58, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalClose: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  modalCloseText: { color: 'rgba(255,255,255,0.6)', ...typography.body },
});
