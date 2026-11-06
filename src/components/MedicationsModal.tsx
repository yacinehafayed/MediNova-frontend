import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useMedicationsStore } from '@/store/medications.store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MedicationsModal({ visible, onClose }: Props) {
  const store = useMedicationsStore();
  const { medications, loadMedications, addMedication, markTaken, deleteMedication } = store;

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('08:00');

  useEffect(() => { if (visible) loadMedications(); }, [visible]);

  const handleAdd = async () => {
    if (!name || !dosage) return Alert.alert('Erreur', 'Nom et dosage requis.');
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);

    const result = await addMedication({
      name, description: '', dosage,
      times: [time],
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    if (result.success) {
      setName(''); setDosage('');
      setShowForm(false);
    } else {
      Alert.alert('Erreur', result.message || 'Erreur');
    }
  };

  const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryDeeper} />
          </TouchableOpacity>
          <Text style={styles.title}>Mes Médicaments</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
          {showForm && (
            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Dosage (ex: 500mg)" placeholderTextColor={colors.textMuted} value={dosage} onChangeText={setDosage} />
              <TextInput style={styles.input} placeholder="Heure (ex: 08:00)" placeholderTextColor={colors.textMuted} value={time} onChangeText={setTime} />
              <TouchableOpacity style={styles.btn} onPress={handleAdd}>
                <LinearGradient colors={gradients.primary} style={styles.btnInner}>
                  <Text style={styles.btnText}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {medications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucun médicament enregistré</Text>
            </View>
          ) : (
            medications.map((med) => (
              <BlurView key={med._id} intensity={50} tint="light" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="medkit" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage} · {med.times.join(', ')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteMedication(med._id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                <View style={styles.timesRow}>
                  {med.times.map((t, i) => {
                    const taken = med.taken?.some(r => r.time === t && isToday(r.date));
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.timeChip, taken && styles.timeChipTaken]}
                        onPress={() => markTaken(med._id, t, taken ? 'missed' : 'taken')}
                      >
                        <Ionicons name={taken ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={taken ? '#FFF' : colors.primary} />
                        <Text style={[styles.timeText, taken && { color: '#FFF' }]}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
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
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: spacing.lg, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.lg, padding: spacing.md },
  input: { backgroundColor: '#FFF', borderRadius: radius.md, height: 50, paddingHorizontal: 16, marginBottom: spacing.sm, fontSize: 15, color: colors.text },
  btn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  btnInner: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  card: { borderRadius: radius.lg, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: spacing.md, ...shadows.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  medName: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper },
  medDosage: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 2 },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: 'rgba(94,127,99,0.1)' },
  timeChipTaken: { backgroundColor: colors.primary },
  timeText: { ...typography.caption, fontWeight: '700', color: colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, marginTop: spacing.md },
});