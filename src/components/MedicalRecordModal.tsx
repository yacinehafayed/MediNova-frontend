import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/theme.store';
import { useMedicalRecordStore } from '@/store/medicalRecord.store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MedicalRecordModal({ visible, onClose }: Props) {
  const isDark = useThemeStore((state) => state.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;
  const styles = createStyles(palette);
  const { record, loadRecord, updateRecord } = useMedicalRecordStore();
  const [editing, setEditing] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [diseases, setDiseases] = useState('');
  const [history, setHistory] = useState('');

  useEffect(() => { if (visible) loadRecord(); }, [visible]);
  useEffect(() => {
    if (record) {
      setBloodType(record.bloodType || '');
      setAllergies((record.allergies || []).join(', '));
      setDiseases((record.chronicDiseases || []).join(', '));
      setHistory(record.medicalHistory || '');
    }
  }, [record]);

  const handleSave = async () => {
    await updateRecord({
      bloodType,
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      chronicDiseases: diseases.split(',').map(s => s.trim()).filter(Boolean),
      medicalHistory: history,
    });
    setEditing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={activeGradients.background} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={palette.primaryDeeper} />
          </TouchableOpacity>
          <Text style={styles.title}>Dossier Médical</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} style={styles.addBtn}>
            <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>

          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.card}>
            <Text style={styles.label}>Groupe sanguin</Text>
            {editing ? (
              <TextInput style={styles.input} value={bloodType} onChangeText={setBloodType} placeholder="A+" placeholderTextColor={palette.textMuted} />
            ) : (
              <Text style={styles.value}>{record?.bloodType || 'Non renseigné'}</Text>
            )}
          </BlurView>


          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.card}>
            <Text style={styles.label}>Allergies</Text>
            {editing ? (
              <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="Séparées par virgule" placeholderTextColor={palette.textMuted} />
            ) : (
              <Text style={styles.value}>{(record?.allergies || []).join(', ') || 'Aucune'}</Text>
            )}
          </BlurView>


          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.card}>
            <Text style={styles.label}>Maladies chroniques</Text>
            {editing ? (
              <TextInput style={styles.input} value={diseases} onChangeText={setDiseases} placeholder="Séparées par virgule" placeholderTextColor={palette.textMuted} />
            ) : (
              <Text style={styles.value}>{(record?.chronicDiseases || []).join(', ') || 'Aucune'}</Text>
            )}
          </BlurView>


          <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.card}>
            <Text style={styles.label}>Antécédents</Text>
            {editing ? (
              <TextInput style={[styles.input, { height: 80 }]} value={history} onChangeText={setHistory} multiline placeholder="Vos antécédents..." placeholderTextColor={palette.textMuted} />
            ) : (
              <Text style={styles.value}>{record?.medicalHistory || 'Non renseigné'}</Text>
            )}
          </BlurView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (palette: typeof colors) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surfaceSolid, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title, color: palette.primaryDeeper },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.primaryDark, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, backgroundColor: palette.surface, marginBottom: spacing.md, ...shadows.soft },
  label: { ...typography.caption, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  value: { ...typography.subtitle, color: palette.primaryDeeper, fontWeight: '600' },
  input: { backgroundColor: palette.surfaceSolid, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: palette.text },
});