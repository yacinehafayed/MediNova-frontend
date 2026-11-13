import { API_ENDPOINTS } from '../../config/api';
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Modal, TextInput, Switch, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';


import MedicationsModal from '@/components/MedicationsModal';
import MedicalRecordModal from '@/components/MedicalRecordModal';
import AnalysesModal from '@/components/AnalysesModal';
import EmergencyModal from '@/components/EmergencyModal';
import ReportsModal from '@/components/ReportsModal';
import CalendarModal from '@/components/CalendarModal';


import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';

const { width, height } = Dimensions.get('window');

type ModalType = 'edit' | 'notifications' | 'privacy' | 'help' | 'password' | null;

const PremiumRing = ({ value, max, color, size = 80 }: { value: number, max: number, color: string, size?: number }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.4" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#ringGrad)" strokeWidth={strokeWidth} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primaryDeeper }}>{value}</Text>
    </View>
  );
};

export default function Profile() {
  const router = useRouter();

  const { user, logout, updateProfile, changePassword, updateSettings } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;
  const styles = createStyles(palette);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editName, setEditName] = useState(user?.name || 'Hamidi');
  const [editEmail, setEditEmail] = useState(user?.email || 'hamidi@example.com');
  const [editDateOfBirth, setEditDateOfBirth] = useState(user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '');
  const [editGender, setEditGender] = useState(user?.gender || '');
  const [editHeight, setEditHeight] = useState(user?.height ? String(user.height) : '');


  const [notifEnabled, setNotifEnabled] = useState(user?.notificationsEnabled ?? true);
  const [remindersEnabled, setRemindersEnabled] = useState(user?.remindersEnabled ?? true);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);


  const [showMedications, setShowMedications] = useState(false);
  const [showMedicalRecord, setShowMedicalRecord] = useState(false);
  const [showAnalyses, setShowAnalyses] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '');
      setEditGender(user.gender || '');
      setEditHeight(user.height ? String(user.height) : '');
      setNotifEnabled(user.notificationsEnabled ?? true);
      setRemindersEnabled(user.remindersEnabled ?? true);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected ?? true));
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      return Alert.alert('Erreur', "Le nom et l'email sont requis.");
    }

    if (editDateOfBirth.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(editDateOfBirth)) {
        return Alert.alert('Erreur', 'Utilisez le format AAAA-MM-JJ pour la date de naissance.');
      }

      const dob = new Date(`${editDateOfBirth}T00:00:00.000Z`);

      if (
        Number.isNaN(dob.getTime()) ||
        dob >= new Date() ||
        dob.toISOString().slice(0, 10) !== editDateOfBirth
      ) {
        return Alert.alert('Erreur', 'Veuillez saisir une date de naissance valide.');
      }
    }

    const parsedHeight = editHeight.trim()
      ? Number(editHeight.replace(',', '.'))
      : undefined;

    if (
      editHeight.trim() &&
      (parsedHeight === undefined ||
        !Number.isFinite(parsedHeight) ||
        parsedHeight < 30 ||
        parsedHeight > 250)
    ) {
      return Alert.alert(
        'Erreur',
        'La taille doit être comprise entre 30 et 250 cm.'
      );
    }

    const result = await updateProfile({
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      ...(editDateOfBirth.trim()
        ? { dateOfBirth: editDateOfBirth }
        : {}),
      gender: editGender,
      ...(parsedHeight !== undefined ? { height: parsedHeight } : {}),
    });

    if (result.success) {
      setActiveModal(null);
      Alert.alert('Succès', 'Votre profil a été mis à jour.');
    } else {
      Alert.alert('Erreur', result.message || 'Impossible de mettre à jour le profil.');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass || !confirmPass) return Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
    if (newPass !== confirmPass) return Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
    if (newPass.length < 6) return Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères.');

    const result = await changePassword(oldPass, newPass);
    if (result.success) {
      setActiveModal(null);
      setOldPass(''); setNewPass(''); setConfirmPass('');
      Alert.alert('Succès', 'Votre mot de passe a été modifié.');
    } else {
      Alert.alert('Erreur', result.message || 'Impossible de modifier le mot de passe.');
    }
  };


  const handleToggleNotif = async (value: boolean) => {
    setNotifEnabled(value);
    await updateSettings({ notificationsEnabled: value });
  };

  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await updateSettings({ remindersEnabled: value });
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données (mesures, rendez-vous, profil) seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await fetch(`${API_ENDPOINTS.auth}/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();

              if (json.success) {
                await logout();
                router.replace('/(auth)/login');
              } else {
                Alert.alert('Erreur', json.message || 'Suppression impossible.');
              }
            } catch {
              Alert.alert('Erreur', 'Impossible de contacter le serveur.');
            }
          },
        },
      ]
    );
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'edit':
        return (
          <>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapper}><Ionicons name="person" size={24} color={palette.primary} /></View>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
            </View>
            <Text style={styles.modalSubtitle}>Mettez à jour vos informations.</Text>
            <Text style={styles.inputLabel}>Nom complet</Text>
            <View style={styles.modalInputWrap}><Ionicons name="person-outline" size={20} color={palette.textMuted} /><TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} /></View>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.modalInputWrap}><Ionicons name="mail-outline" size={20} color={palette.textMuted} /><TextInput style={styles.modalInput} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" /></View>
            <Text style={styles.inputLabel}>Date de naissance (AAAA-MM-JJ)</Text>
            <View style={styles.modalInputWrap}>
              <Ionicons name="calendar-outline" size={20} color={palette.textMuted} />
              <TextInput
                style={styles.modalInput}
                value={editDateOfBirth}
                onChangeText={setEditDateOfBirth}
                placeholder="Ex. 1998-05-21"
                placeholderTextColor={palette.textMuted}
              />
            </View>
            <Text style={styles.inputLabel}>Sexe (pour les références médicales)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
              {[
                { value: 'female', label: 'Femme' },
                { value: 'male', label: 'Homme' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setEditGender(option.value)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: radius.md,
                    alignItems: 'center',
                    backgroundColor: editGender === option.value ? palette.primary : palette.surfaceSolid,
                    borderWidth: 1, borderColor: editGender === option.value ? palette.primary : palette.glassBorder,
                  }}
                >
                  <Text style={{ color: editGender === option.value ? '#FFFFFF' : palette.text, fontSize: 13, fontWeight: '600' }}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Taille (cm)</Text>
            <View style={styles.modalInputWrap}>
              <Ionicons name="resize-outline" size={20} color={palette.textMuted} />
              <TextInput
                style={styles.modalInput}
                value={editHeight}
                onChangeText={setEditHeight}
                keyboardType="decimal-pad"
                placeholder="Ex. 170"
                placeholderTextColor={palette.textMuted}
              />
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveProfile}><LinearGradient colors={gradients.primary} style={styles.modalBtnInner}><Text style={styles.modalBtnText}>Enregistrer</Text></LinearGradient></TouchableOpacity>
          </>
        );
      case 'password':
        return (
          <>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrapper, { backgroundColor: '#FCE8E8' }]}><Ionicons name="lock-closed" size={24} color={palette.danger} /></View>
              <Text style={styles.modalTitle}>Mot de passe</Text>
            </View>
            <Text style={styles.modalSubtitle}>Changez votre mot de passe.</Text>
            <Text style={styles.inputLabel}>Ancien mot de passe</Text>
            <View style={styles.modalInputWrap}><Ionicons name="key" size={20} color={palette.textMuted} /><TextInput style={styles.modalInput} value={oldPass} onChangeText={setOldPass} secureTextEntry /></View>
            <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
            <View style={styles.modalInputWrap}><Ionicons name="lock-closed-outline" size={20} color={palette.textMuted} /><TextInput style={styles.modalInput} value={newPass} onChangeText={setNewPass} secureTextEntry /></View>
            <Text style={styles.inputLabel}>Confirmer</Text>
            <View style={styles.modalInputWrap}><Ionicons name="checkmark-circle-outline" size={20} color={palette.textMuted} /><TextInput style={styles.modalInput} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry /></View>
            <TouchableOpacity style={styles.modalBtn} onPress={handleChangePassword}><LinearGradient colors={gradients.primary} style={styles.modalBtnInner}><Text style={styles.modalBtnText}>Modifier le mot de passe</Text></LinearGradient></TouchableOpacity>
          </>
        );
      case 'notifications':
        return (
          <>
            <View style={styles.modalHeader}><View style={[styles.modalIconWrapper, { backgroundColor: '#E8F0FC' }]}><Ionicons name="notifications" size={24} color="#4A7BEB" /></View><Text style={styles.modalTitle}>Notifications</Text></View>
            <Text style={styles.modalSubtitle}>Gérez vos alertes.</Text>
            <View style={styles.settingRow}>
              <View><Text style={styles.settingTitle}>Notifications Push</Text><Text style={styles.settingDesc}>Alertes de santé</Text></View>
              <Switch value={notifEnabled} onValueChange={handleToggleNotif} trackColor={{ false: isDark ? '#405447' : '#E2E8F0', true: palette.primary }} />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View><Text style={styles.settingTitle}>Rappels médicaments</Text><Text style={styles.settingDesc}>Ne ratez plus une prise</Text></View>
              <Switch value={remindersEnabled} onValueChange={handleToggleReminders} trackColor={{ false: isDark ? '#405447' : '#E2E8F0', true: palette.primary }} />
            </View>
          </>
        );
      case 'privacy':
        return (
          <>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrapper, { backgroundColor: '#FDF2E9' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#E67E22" />
              </View>
              <Text style={styles.modalTitle}>Confidentialité</Text>
            </View>
            <Text style={styles.modalSubtitle}>Contrôlez vos données et votre vie privée.</Text>


            <Text style={styles.privacySectionTitle}>1. Protection des données</Text>
            <Text style={styles.privacySectionText}>
              Vos données personnelles et médicales sont chiffrées (AES-256) et stockées de manière sécurisée sur MongoDB Atlas. Aucun accès non autorisé n'est possible.
            </Text>
            <View style={styles.divider} />


            <Text style={styles.privacySectionTitle}>2. Gestion des données personnelles</Text>

            <TouchableOpacity
              style={styles.privacyActionRow}
              onPress={() => { setActiveModal('edit'); }}
            >
              <Ionicons name="person-outline" size={18} color={palette.primary} />
              <Text style={styles.privacyActionLabel}>Consulter / modifier mon profil</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.privacyActionRow}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={18} color={palette.danger} />
              <Text style={[styles.privacyActionLabel, { color: palette.danger }]}>Supprimer mon compte et mes données</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.danger} />
            </TouchableOpacity>
            <View style={styles.divider} />


            <Text style={styles.privacySectionTitle}>3. Confidentialité de l'assistant IA</Text>
            <Text style={styles.privacySectionText}>
              Vos questions et mesures sont envoyées à l'IA uniquement pour générer une réponse. Aucune donnée identifiante n'est transmise à un service externe, et rien n'est conservé après traitement.
            </Text>
            <View style={styles.divider} />


            <Text style={styles.privacySectionTitle}>4. Autorisations et notifications</Text>

            <TouchableOpacity
              style={styles.privacyActionRow}
              onPress={() => { setActiveModal('notifications'); }}
            >
              <Ionicons name="notifications-outline" size={18} color={palette.primary} />
              <Text style={styles.privacyActionLabel}>Gérer mes notifications</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.privacyActionRow}
              onPress={() =>
                Alert.alert(
                  'Autorisations',
                  'Pour modifier les autorisations système (notifications, appareil photo, stockage), ouvrez les réglages de votre téléphone → Applications → MediNova → Autorisations.'
                )
              }
            >
              <Ionicons name="settings-outline" size={18} color={palette.primary} />
              <Text style={styles.privacyActionLabel}>Paramètres d'autorisations du téléphone</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />


            <Text style={styles.privacySectionTitle}>5. Politique de confidentialité</Text>

            <TouchableOpacity
              style={styles.privacyActionRow}
              onPress={() =>
                Alert.alert(
                  'Politique de confidentialité',
                  'Données collectées : nom, email, mesures de santé, rendez-vous.\n\nUtilisation : suivi personnel et réponses de l\'assistant IA.\n\nConservation : tant que votre compte existe.\n\nDroits : accès, modification, suppression à tout moment depuis cet écran.\n\nAucune revente de données à des tiers.'
                )
              }
            >
              <Ionicons name="document-text-outline" size={18} color={palette.primary} />
              <Text style={styles.privacyActionLabel}>Lire la politique de confidentialité</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
            </TouchableOpacity>
          </>
        );
      case 'help':
        const faqs = [
          { q: "Comment ajouter une mesure ?", a: "Rendez-vous dans l'onglet 'Santé' et cliquez sur '+'." },
          { q: "L'IA peut-elle me diagnostiquer ?", a: "Non, elle fournit des informations générales." },
        ];
        return (
          <>
            <View style={styles.modalHeader}><View style={[styles.modalIconWrapper, { backgroundColor: '#F4E9FD' }]}><Ionicons name="help-buoy" size={24} color="#9B59B6" /></View><Text style={styles.modalTitle}>Aide & Support</Text></View>
            {faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <TouchableOpacity style={styles.faqHeader} onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons name={expandedFaq === index ? "chevron-up" : "chevron-down"} size={20} color={palette.textMuted} />
                </TouchableOpacity>
                {expandedFaq === index && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </View>
            ))}
          </>
        );
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <LinearGradient colors={activeGradients.background} style={StyleSheet.absoluteFill} />
      <View  style={[ styles.orb,{  top: -100,  right: -80,  backgroundColor: isDark  ? 'rgba(140,185,144,0.10)'  : 'rgba(255,255,255,0.4)', }, ]}/>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#FFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: palette.textMuted }]}>Mon espace</Text>
              <Text style={[styles.headerTitle, { color: palette.text }]}>Profil</Text>
            </View>
          </View>


          <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[ styles.mainCard, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder }, ]}>
            <View style={styles.avatarWrapper}>
              <LinearGradient colors={gradients.gold} style={styles.avatarRing}>
                <View style={styles.avatarInner}><Ionicons name="person" size={40} color={palette.primaryDark} /></View>
              </LinearGradient>
            </View>
            <Text style={[styles.userName, { color: palette.text }]}>{user?.name || 'Utilisateur'}</Text>
            <Text style={[styles.userEmail, { color: palette.textMuted }]}>{user?.email || 'email@example.com'}</Text>
            
            <TouchableOpacity style={styles.editBtn} onPress={() => setActiveModal('edit')}>
              <LinearGradient colors={activeGradients.primary} style={styles.editBtnGradient}>
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={styles.editBtnText}>Modifier le profil</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          <Text style={[styles.sectionTitle, { color: palette.text }]}>Paramètres</Text>
          <BlurView intensity={isDark ? 20 : 60} tint={isDark ? 'dark' : 'light'} style={[ styles.menuContainer, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder }, ]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMedicalRecord(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#E8FCE8' }]}>
                <Ionicons name="medical" size={20} color={palette.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Dossier médical</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMedications(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#E8F0FC' }]}>
                <Ionicons name="medkit" size={20} color="#4A7BEB" />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Mes médicaments</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <TouchableOpacity style={styles.menuItem} onPress={() => setShowAnalyses(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#F4E9FD' }]}>
                <Ionicons name="flask" size={20} color="#9B59B6" />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Mes analyses</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <TouchableOpacity style={styles.menuItem} onPress={() => setShowEmergency(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#FCE8E8' }]}>
                <Ionicons name="alert-circle" size={20} color={palette.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Informations d'urgence</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <TouchableOpacity style={styles.menuItem} onPress={() => setShowReports(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="bar-chart" size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Rapports de santé</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <TouchableOpacity style={styles.menuItem} onPress={() => setShowCalendar(true)}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="calendar" size={20} color="#FF9800" />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Calendrier de santé</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />


            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: isDark ? '#2A3A2F' : '#F0F4EF' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? '#8CB990' : palette.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Mode Sombre</Text>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: isDark ? '#405447' : '#E2E8F0', true: palette.primary }} />
            </View>
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('password')}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#FCE8E8' }]}><Ionicons name="lock-closed" size={20} color={palette.danger} /></View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Changer le mot de passe</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('notifications')}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#F0F4EF' }]}><Ionicons name="notifications" size={20} color={palette.primary} /></View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => setActiveModal('privacy')}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#FDF2E9' }]}><Ionicons name="shield-checkmark" size={20} color="#E67E22" /></View>
              <Text style={[styles.menuLabel, { color: palette.text }]}>Confidentialité</Text>
              <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={palette.danger} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>


      <Modal visible={activeModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setActiveModal(null)} />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {renderModalContent()}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={24} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <MedicationsModal visible={showMedications} onClose={() => setShowMedications(false)} />
      <MedicalRecordModal visible={showMedicalRecord} onClose={() => setShowMedicalRecord(false)} />
      <AnalysesModal visible={showAnalyses} onClose={() => setShowAnalyses(false)} />
      <EmergencyModal visible={showEmergency} onClose={() => setShowEmergency(false)} />
      <ReportsModal visible={showReports} onClose={() => setShowReports(false)} />
      <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} />
    </View>
  );
}

const createStyles = (palette: typeof colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scroll: { padding: spacing.lg, paddingTop: 64, paddingBottom: 150 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: palette.surface },

  offlineBanner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: palette.danger, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 999 },
  offlineText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerSubtitle: { ...typography.caption, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { ...typography.display, color: palette.primaryDeeper },

  mainCard: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.glassBorder, ...shadows.soft, overflow: 'hidden' },

  avatarWrapper: { marginBottom: spacing.md, position: 'relative' },
  avatarRing: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', ...shadows.strong },
  avatarInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: palette.surfaceSolid, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: palette.glassBorder },

  userName: { ...typography.title, color: palette.primaryDeeper, fontSize: 22 },
  userEmail: { ...typography.body, color: palette.textMuted, marginTop: 4, marginBottom: 10 },

  editBtn: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  editBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.pill },
  editBtnText: { ...typography.subtitle, color: '#FFF', fontWeight: '700' },
  sectionTitle: { ...typography.subtitle, fontWeight: '700', color: palette.primaryDeeper, marginTop: spacing.xl, marginBottom: spacing.md, marginLeft: 4 },

  menuContainer: { borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.glassBorder, ...shadows.soft, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingVertical: 16 },
  menuIconWrapper: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuLabel: { flex: 1, ...typography.body, fontWeight: '600', color: palette.text },
  menuDivider: { height: 1, backgroundColor: palette.glassBorder, marginLeft: 68 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.pill, backgroundColor: 'rgba(217,83,79,0.08)', borderWidth: 1, borderColor: 'rgba(217,83,79,0.15)' },
  logoutText: { ...typography.subtitle, fontWeight: '700', color: palette.danger },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: palette.surfaceSolid, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xl, paddingTop: 12, maxHeight: height * 0.85, minHeight: 300, ...shadows.strong },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: palette.glassBorder, alignSelf: 'center', marginBottom: spacing.lg },
  closeBtn: { position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm, marginTop: spacing.md },
  modalIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E3F0E4', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { ...typography.title, fontSize: 22, color: palette.primaryDeeper },
  modalSubtitle: { ...typography.body, color: palette.textMuted, marginBottom: spacing.xl },
  inputLabel: { ...typography.caption, fontWeight: '700', color: palette.textMuted, marginBottom: 8, marginLeft: 4 },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surfaceSolid, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 56, marginBottom: spacing.lg, borderWidth: 1, borderColor: palette.glassBorder },
  modalInput: { flex: 1, fontSize: 15, color: palette.text },
  modalBtn: { width: '100%', borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  modalBtnInner: { flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  settingTitle: { ...typography.subtitle, fontWeight: '600', color: palette.text },
  settingDesc: { ...typography.caption, color: palette.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: palette.glassBorder, marginVertical: spacing.xs },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: spacing.md },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { ...typography.subtitle, fontWeight: '600', color: palette.text, flex: 1, marginRight: 16 },
  faqAnswer: { ...typography.body, color: palette.textMuted, marginTop: 8, lineHeight: 22 },
  // --- Styles Confidentialité ---
  privacySectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: palette.text,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  privacySectionText: {
    ...typography.body,
    color: palette.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  privacyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  privacyActionLabel: {
    flex: 1,
    ...typography.body,
    fontWeight: '600',
    color: palette.text,
  },
});