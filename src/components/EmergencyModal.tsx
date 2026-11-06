import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Linking, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useEmergencyStore } from '@/store/emergency.store';

export default function EmergencyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { info, loadInfo, updateInfo } = useEmergencyStore();
  const [editing, setEditing] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [treatments, setTreatments] = useState('');

  useEffect(() => { if (visible) loadInfo(); }, [visible]);
  useEffect(() => {
    if (info) {
      setContactName(info.contactName || '');
      setContactPhone(info.contactPhone || '');
      setBloodType(info.bloodType || '');
      setAllergies(info.allergies || '');
      setTreatments(info.importantTreatments || '');
    }
  }, [info]);

  const handleSave = async () => {
    await updateInfo({ contactName, contactPhone, bloodType, allergies, importantTreatments: treatments });
    setEditing(false);
  };

  const callEmergency = () => {
    if (!info?.contactPhone) return Alert.alert('Erreur', 'Aucun numéro enregistré.');
    Linking.openURL(`tel:${info.contactPhone}`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={['#2E1514', '#4A1F1D', '#2E1514']} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#FFF' }]}>Urgence</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} style={styles.addBtn}>
            <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
          {/* Bouton d'appel d'urgence */}
          <TouchableOpacity style={styles.callBtn} onPress={callEmergency}>
            <Ionicons name="call" size={32} color="#FFF" />
            <Text style={styles.callText}>APPELER CONTACT D'URGENCE</Text>
          </TouchableOpacity>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.label}>Contact d'urgence</Text>
            {editing ? (
              <>
                <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Nom" placeholderTextColor="rgba(255,255,255,0.4)" />
                <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="Téléphone" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="phone-pad" />
              </>
            ) : (
              <>
                <Text style={styles.value}>{info?.contactName || 'Non renseigné'}</Text>
                <Text style={styles.value}>{info?.contactPhone || '—'}</Text>
              </>
            )}
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.label}>Groupe sanguin</Text>
            {editing ? <TextInput style={styles.input} value={bloodType} onChangeText={setBloodType} placeholder="A+" placeholderTextColor="rgba(255,255,255,0.4)" /> : <Text style={styles.value}>{info?.bloodType || 'Non renseigné'}</Text>}
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.label}>Allergies</Text>
            {editing ? <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="Ex: Pénicilline" placeholderTextColor="rgba(255,255,255,0.4)" /> : <Text style={styles.value}>{info?.allergies || 'Aucune'}</Text>}
          </BlurView>

          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.label}>Traitements importants</Text>
            {editing ? <TextInput style={[styles.input, { height: 80 }]} value={treatments} onChangeText={setTreatments} multiline placeholder="Ex: Insuline" placeholderTextColor="rgba(255,255,255,0.4)" /> : <Text style={styles.value}>{info?.importantTreatments || 'Aucun'}</Text>}
          </BlurView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingTop: 60 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  callBtn: { backgroundColor: '#E53E3E', borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg, ...shadows.strong },
  callText: { color: '#FFF', fontWeight: '800', marginTop: 8, fontSize: 14 },
  card: { borderRadius: radius.lg, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  label: { ...typography.caption, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  value: { ...typography.subtitle, color: '#FFF', fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: '#FFF', fontSize: 15, marginTop: 4 },
});