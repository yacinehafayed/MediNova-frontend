import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Easing, Dimensions, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
};

function Field({ icon, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = Math.min(
    4,
    (password.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[0-9]/.test(password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
  );


  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) return setError('Veuillez remplir tous les champs.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    if (!accepted) return setError("Veuillez accepter les conditions d'utilisation.");

    setError('');
    setLoading(true);

    const result = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/dashboard');
    } else {
      setError(result.message || "Impossible de créer le compte.");
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <LinearGradient colors={gradients.background} style={styles.flex}>
        <View style={[styles.orb, { top: -90, left: -70, width: 260, height: 260 }]} />
        <View style={[styles.orb, { bottom: 40, right: -100, width: 280, height: 280, opacity: 0.35 }]} />

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.primaryDark} />
            </TouchableOpacity>

            <Text style={styles.title}>Créer votre{'\n'}compte</Text>
            <Text style={styles.subtitle}>Rejoignez MediNova en quelques secondes</Text>

            <BlurView intensity={50} tint="light" style={styles.card}>
              <Field icon="person-outline" placeholder="Nom complet" value={name} onChangeText={setName} autoCapitalize="words" />
              <Field icon="mail-outline" placeholder="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <Field icon="lock-closed-outline" placeholder="Mot de passe" value={password} onChangeText={setPassword} secure />

              <View style={styles.strengthRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? colors.primary : 'rgba(47,74,53,0.12)' }]} />
                ))}
              </View>

              <Field icon="shield-checkmark-outline" placeholder="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} secure />

              <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted((a) => !a)} activeOpacity={0.8}>
                <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                  {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkText}>
                  J'accepte les <Text style={styles.link}>conditions d'utilisation</Text> et la{' '}
                  <Text style={styles.link}>politique de confidentialité</Text>
                </Text>
              </TouchableOpacity>

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity activeOpacity={0.85} onPress={onSubmit} disabled={loading}>
                <LinearGradient colors={gradients.primary} style={[styles.button, shadows.strong]}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.buttonText}>Créer mon compte</Text>
                      <View style={styles.arrow}><Ionicons name="arrow-forward" size={16} color={colors.primaryDark} /></View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Déjà inscrit ? </Text>
              <Link href="/(auth)/login" style={styles.footerLink}>Se connecter</Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, ...shadows.soft },
  title: { ...typography.display, color: colors.primaryDeeper, lineHeight: 40 },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 8, marginBottom: spacing.lg },
  card: { borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.45)', ...shadows.soft },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: radius.md, paddingHorizontal: spacing.md, height: 56, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  input: { flex: 1, fontSize: 15, color: colors.text },
  strengthRow: { flexDirection: 'row', gap: 6, marginTop: -4, marginBottom: spacing.md, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.primary },
  checkText: { flex: 1, ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  link: { color: colors.primaryDark, fontWeight: '700' },
  error: { color: colors.danger, ...typography.caption, marginBottom: spacing.sm },
  button: { height: 58, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  arrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  footerText: { color: colors.textMuted, ...typography.body },
  footerLink: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
});