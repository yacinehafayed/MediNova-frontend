import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAnalysesStore } from '@/store/analyses.store';

export default function AnalysesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { analyses, loadAnalyses, addAnalysis, deleteAnalysis } = useAnalysesStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('g/L');
  const [reference, setReference] = useState('');

  useEffect(() => { if (visible) loadAnalyses(); }, [visible]);

  const handleAdd = async () => {
    if (!name || !value) return Alert.alert('Erreur', 'Nom et valeur requis.');
    const result = await addAnalysis({
      name, value: parseFloat(value), unit, reference,
      date: new Date().toISOString(), notes: '',
    });
    if (result.success) {
      setName(''); setValue(''); setReference('');
      setShowForm(false);
    } else Alert.alert('Erreur', result.message || 'Erreur');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryDeeper} />
          </TouchableOpacity>
          <Text style={styles.title}>Analyses</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
          {showForm && (
            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="Nom (ex: Glycémie)" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Valeur" placeholderTextColor={colors.textMuted} value={value} onChangeText={setValue} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Unité (g/L, mg/dL)" placeholderTextColor={colors.textMuted} value={unit} onChangeText={setUnit} />
              <TextInput style={styles.input} placeholder="Référence (0.7 - 1.1)" placeholderTextColor={colors.textMuted} value={reference} onChangeText={setReference} />
              <TouchableOpacity style={styles.btn} onPress={handleAdd}>
                <LinearGradient colors={gradients.primary} style={styles.btnInner}>
                  <Text style={styles.btnText}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {analyses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucune analyse</Text>
            </View>
          ) : (
            analyses.map((a) => (
              <BlurView key={a._id} intensity={50} tint="light" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="flask" size={22} color="#9B59B6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.analysisName}>{a.name}</Text>
                    <Text style={styles.analysisValue}>{a.value} {a.unit}</Text>
                    {!!a.reference && <Text style={styles.analysisRef}>Réf: {a.reference}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => deleteAnalysis(a._id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.analysisDate}>
                  {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
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
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(155,89,182,0.15)', alignItems: 'center', justifyContent: 'center' },
  analysisName: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper },
  analysisValue: { ...typography.title, color: '#9B59B6', fontWeight: '800', marginTop: 2 },
  analysisRef: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  analysisDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.subtitle, fontWeight: '700', color: colors.primaryDeeper, marginTop: spacing.md },
});