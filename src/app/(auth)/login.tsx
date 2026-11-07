import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard, TouchableWithoutFeedback,
  Animated, Easing, Dimensions, Pressable, Modal, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { colors, gradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import SplashIntro from '@/components/SplashIntro';
import VitalisLogo from '@/components/VitalisLogo';

const { height: SCREEN_H } = Dimensions.get('window');
const LOGO_SIZE = 76;

function useLoop(duration: number, opts: { delay?: number; reverse?: boolean; enabled?: boolean } = {}) {
  const { delay = 0, reverse = true, enabled = true } = opts;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) return;
    const easing = reverse ? Easing.inOut(Easing.sin) : Easing.out(Easing.quad);
    const anim = Animated.loop(
      reverse
        ? Animated.sequence([
            Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration, easing, useNativeDriver: true }),
          ])
        : Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true })
    );
    const t = setTimeout(() => anim.start(), delay);
    return () => { clearTimeout(t); anim.stop(); };
  }, [enabled]);
  return v;
}

function FloatingOrb({ style, duration, dx, dy, delay = 0 }: { style: any; duration: number; dx: number; dy: number; delay?: number; }) {
  const v = useLoop(duration, { delay });
  return (
    <Animated.View pointerEvents="none" style={[styles.orb, style, { transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
    ]}]} />
  );
}

function Particle({ left, size, duration, delay }: { left: number; size: number; duration: number; delay: number; }) {
  const v = useLoop(duration, { delay, reverse: false });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', bottom: -20, left,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: 'rgba(255,255,255,0.9)',
      opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.8, 0.5, 0] }),
      transform: [
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_H * 0.9] }) },
        { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, -10] }) },
      ],
    }} />
  );
}

const PARTICLES = [
  { left: 24, size: 6, duration: 9000, delay: 0 },
  { left: 70, size: 4, duration: 12000, delay: 2500 },
  { left: 120, size: 8, duration: 10000, delay: 1200 },
  { left: 180, size: 5, duration: 13000, delay: 4000 },
  { left: 230, size: 7, duration: 9500, delay: 800 },
  { left: 280, size: 4, duration: 11500, delay: 3300 },
  { left: 330, size: 6, duration: 10500, delay: 1800 },
  { left: 370, size: 5, duration: 12500, delay: 5200 },
];

function PulseRing({ delay }: { delay: number }) {
  const v = useLoop(2600, { delay, reverse: false });
  return (
    <Animated.View pointerEvents="none" style={[styles.ring, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] }]} />
  );
}

function AnimatedLogo({ visible }: { visible: boolean }) {
  const float = useLoop(2400, { enabled: visible });
  return (
    <View style={[styles.logoBox, { opacity: visible ? 1 : 0 }]}>
      <Animated.View style={[styles.logoBox, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}>
        {visible && (<><PulseRing delay={0} /><PulseRing delay={870} /><PulseRing delay={1740} /></>)}
        <View style={styles.logoShadow}>
          <VitalisLogo size={LOGO_SIZE} />
        </View>
      </Animated.View>
    </View>
  );
}

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  right?: React.ReactNode;
};

function AuthField({ icon, placeholder, value, onChangeText, secure, keyboardType, right }: FieldProps) {
  const focus = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);
  const animate = (to: number) => { setFocused(to === 1); Animated.spring(focus, { toValue: to, friction: 7, tension: 90, useNativeDriver: false }).start(); };
  return (
    <Animated.View style={[styles.inputWrap, {
      borderColor: focus.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.9)', colors.primary] }),
      backgroundColor: focus.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,1)'] }),
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14,
      shadowOpacity: focus.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) as any,
      transform: [{ scale: focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }],
    }]}>
      <Ionicons name={icon} size={20} color={focused ? colors.primary : colors.textMuted} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType={keyboardType} secureTextEntry={secure} value={value} onChangeText={onChangeText} onFocus={() => animate(1)} onBlur={() => animate(0)} />
      {right}
    </Animated.View>
  );
}

function SocialButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, friction: 5, tension: 160, useNativeDriver: true }).start();
  return (
    <Pressable onPressIn={() => to(0.88)} onPressOut={() => to(1)} onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[styles.social, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [btnW, setBtnW] = useState(300);


  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);


  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'Google' | 'Apple'>('Google');
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  const enter = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!ready) return;
    Animated.stagger(120, enter.map((v) => Animated.timing(v, { toValue: 1, duration: 750, easing: Easing.out(Easing.cubic), useNativeDriver: true }))).start();
  }, [ready]);

  const fadeUp = (i: number, distance = 30) => ({
    opacity: enter[i],
    transform: [{ translateY: enter[i].interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  const shake = useRef(new Animated.Value(0)).current;
  const doShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };
  const fail = (msg: string) => { setError(msg); doShake(); };

  const press = useRef(new Animated.Value(1)).current;
  const pressTo = (v: number) => Animated.spring(press, { toValue: v, friction: 6, tension: 180, useNativeDriver: true }).start();
  const sweep = useLoop(2600, { delay: 1500, reverse: false });
  const nudge = useLoop(700);

  const onSubmit = async () => {
    if (!email.trim() || !password) { fail('Veuillez remplir tous les champs.'); return; }
    setError(''); setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.success) router.replace('/(tabs)/dashboard');
    else fail(result.message || 'Erreur de connexion.');
  };


  const handleSendCode = async () => {
    if (!resetEmail.trim()) return Alert.alert('Erreur', 'Entrez votre email.');
    setForgotLoading(true);
    const forgot = useAuthStore.getState().forgotPassword;
    const result = await forgot(resetEmail.trim().toLowerCase());
    setForgotLoading(false);

    if (result.success) {
      if (result.code) {
        Alert.alert(
          'Code de test',
          `Code reçu : ${result.code}\n\n(Ce code est aussi dans la console du serveur)`,
          [{ text: 'OK', onPress: () => setForgotStep('code') }]
        );
      } else {
        setForgotStep('code');
      }
    } else {
      Alert.alert('Erreur', result.message || 'Erreur.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) return Alert.alert('Erreur', 'Remplissez tous les champs.');
    if (newPassword.length < 6) return Alert.alert('Erreur', 'Min. 6 caractères.');
    setForgotLoading(true);
    const reset = useAuthStore.getState().resetPassword;
    const result = await reset(resetEmail.trim().toLowerCase(), resetCode.trim(), newPassword);
    setForgotLoading(false);

    if (result.success) {
      Alert.alert('Succès', 'Mot de passe réinitialisé ! Connectez-vous.');
      setForgotModalVisible(false);
      setForgotStep('email');
      setResetEmail(''); setResetCode(''); setNewPassword('');
    } else {
      Alert.alert('Erreur', result.message || 'Code invalide.');
    }
  };


  const openSocialModal = (provider: 'Google' | 'Apple') => {
    setSocialProvider(provider);
    setSocialModalVisible(true);
  };

  const handleSocialLogin = async () => {
    setIsSocialLoading(true);
    const social = useAuthStore.getState().socialLogin;
    const demoEmail = socialProvider === 'Google' ? 'demo.google@medinova.com' : 'demo.apple@medinova.com';
    const demoName = socialProvider === 'Google' ? 'Utilisateur Google' : 'Utilisateur Apple';
    const result = await social(socialProvider, demoEmail, demoName);
    setIsSocialLoading(false);
    setSocialModalVisible(false);

    if (result.success) {
      router.replace('/(tabs)/dashboard');
    } else {
      Alert.alert('Erreur', result.message || 'Connexion impossible.');
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient colors={gradients.background} style={styles.flex}>
        <FloatingOrb style={{ top: -80, right: -60, width: 260, height: 260 }} duration={5200} dx={-30} dy={40} />
        <FloatingOrb style={{ bottom: 80, left: -100, width: 280, height: 280, opacity: 0.35 }} duration={6400} dx={40} dy={-30} delay={600} />
        {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>

            <View style={styles.logoWrap}>
              <AnimatedLogo visible={logoVisible} />
              <Animated.View style={[{ alignItems: 'center' }, fadeUp(0, 24)]}>
                <Text style={styles.brand}>MediNova</Text>
                <Text style={styles.tagline}>Votre santé, sublimée par l'IA</Text>
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: enter[1], transform: [{ translateY: enter[1].interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }, { scale: enter[1].interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }) }] }}>
              <BlurView intensity={50} tint="light" style={styles.card}>
                <Animated.View style={fadeUp(2, 20)}>
                  <Text style={styles.title}>{getGreeting()}</Text>
                  <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
                </Animated.View>

                <Animated.View style={fadeUp(3, 24)}>
                  <AuthField icon="mail-outline" placeholder="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                  <AuthField icon="lock-closed-outline" placeholder="Mot de passe" value={password} onChangeText={setPassword} secure={!showPwd} right={<TouchableOpacity onPress={() => setShowPwd(s => !s)}><Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} /></TouchableOpacity>} />
                  <TouchableOpacity style={styles.forgot} onPress={() => { setForgotModalVisible(true); setForgotStep('email'); }}><Text style={styles.forgotText}>Mot de passe oublié ?</Text></TouchableOpacity>
                  {!!error && <Text style={styles.error}>{error}</Text>}
                </Animated.View>

                <Animated.View style={fadeUp(4, 24)}>
                  <Pressable onPress={onSubmit} disabled={loading} onPressIn={() => pressTo(0.95)} onPressOut={() => pressTo(1)} onLayout={(e) => setBtnW(e.nativeEvent.layout.width)}>
                    <Animated.View style={{ transform: [{ scale: press }] }}>
                      <LinearGradient colors={gradients.primary} style={[styles.button, shadows.strong]}>
                        <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-120, btnW + 120] }) }, { rotate: '20deg' }] }]}>
                          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
                        </Animated.View>
                        {loading ? <ActivityIndicator color="#fff" /> : (
                          <><Text style={styles.buttonText}>Se connecter</Text>
                            <Animated.View style={[styles.arrow, { transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }] }]}>
                              <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
                            </Animated.View>
                          </>
                        )}
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.line} /><Text style={styles.or}>ou continuer avec</Text><View style={styles.line} />
                  </View>

                  <View style={styles.socialRow}>
                    <SocialButton onPress={() => openSocialModal('Google')}><Ionicons name="logo-google" size={20} color={colors.text} /><Text style={styles.socialText}>Google</Text></SocialButton>
                    <SocialButton onPress={() => openSocialModal('Apple')}><Ionicons name="logo-apple" size={22} color={colors.text} /><Text style={styles.socialText}>Apple</Text></SocialButton>
                  </View>
                </Animated.View>
              </BlurView>
            </Animated.View>

            <Animated.View style={[styles.footer, fadeUp(5, 16)]}>
              <Text style={styles.footerText}>Pas encore de compte ? </Text>
              <Link href="/(auth)/register" style={styles.footerLink}>Créer un compte</Link>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </LinearGradient>


      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}><Ionicons name="lock-open" size={32} color={colors.primary} /></View>
            <Text style={styles.modalTitle}>
              {forgotStep === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {forgotStep === 'email'
                ? 'Entrez votre email pour recevoir un code à 6 chiffres.'
                : 'Entrez le code reçu et votre nouveau mot de passe.'}
            </Text>

            {forgotStep === 'email' ? (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="votre@email.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity style={styles.modalBtn} onPress={handleSendCode} disabled={forgotLoading}>
                  <LinearGradient colors={gradients.primary} style={styles.modalBtnInner}>
                    {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Envoyer le code</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Code à 6 chiffres"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TouchableOpacity style={styles.modalBtn} onPress={handleResetPassword} disabled={forgotLoading}>
                  <LinearGradient colors={gradients.primary} style={styles.modalBtnInner}>
                    {forgotLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Réinitialiser</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.modalClose} onPress={() => { setForgotModalVisible(false); setForgotStep('email'); setResetEmail(''); setResetCode(''); setNewPassword(''); }}>
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Modal visible={socialModalVisible} transparent animationType="slide">
        <View style={styles.socialOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.socialSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.socialHeader}>
              <View style={styles.socialIconWrap}>
                <Ionicons name={socialProvider === 'Google' ? 'logo-google' : 'logo-apple'} size={24} color={colors.text} />
              </View>
              <Text style={styles.socialTitle}>Se connecter avec {socialProvider}</Text>
            </View>
            <Text style={styles.socialDesc}>Choisissez un compte pour continuer vers MediNova</Text>
            <TouchableOpacity style={styles.accountRow} onPress={handleSocialLogin} disabled={isSocialLoading}>
              <View style={styles.accountAvatar}><Text style={styles.avatarLetter}>M</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Compte de démonstration</Text>
                <Text style={styles.accountEmail}>
                  {socialProvider === 'Google' ? 'demo.google@medinova.com' : 'demo.apple@medinova.com'}
                </Text>
              </View>
              {isSocialLoading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSocialModalVisible(false)} disabled={isSocialLoading}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showSplash && (
        <SplashIntro
          onReveal={() => setReady(true)}
          onDone={() => { setLogoVisible(true); setShowSplash(false); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl, marginTop: Platform.OS === 'ios' ? 40 : 20 },
  logoBox: { width: LOGO_SIZE, height: LOGO_SIZE, alignItems: 'center', justifyContent: 'center' },
  logoShadow: { shadowColor: '#16251A', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 12, borderRadius: 24 },
  ring: { position: 'absolute', width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 24, borderWidth: 2, borderColor: colors.primary },
  brand: { ...typography.display, color: colors.primaryDeeper, marginTop: spacing.md },
  tagline: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  card: { borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.45)', ...shadows.soft },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 56, marginBottom: spacing.md, borderWidth: 1.5 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.md },
  forgotText: { ...typography.caption, color: colors.primary },
  error: { color: colors.danger, ...typography.caption, marginBottom: spacing.sm },
  button: { height: 58, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden' },
  shine: { position: 'absolute', top: -20, bottom: -20, width: 70 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  arrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(47,74,53,0.15)' },
  or: { ...typography.caption, color: colors.textMuted },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  social: { flexDirection: 'row', height: 52, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff', gap: 8 },
  socialText: { ...typography.body, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  footerText: { color: colors.textMuted, ...typography.body },
  footerLink: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { width: '100%', backgroundColor: colors.primaryDeeper, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', ...shadows.strong },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(94,127,99,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.title, color: '#FFFFFF', marginBottom: 8 },
  modalSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: spacing.lg },
  modalInput: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, height: 56, paddingHorizontal: spacing.md, color: '#FFFFFF', fontSize: 16, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalBtn: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  modalBtnInner: { height: 56, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalClose: { marginTop: spacing.md, padding: spacing.sm },
  modalCloseText: { color: 'rgba(255,255,255,0.6)', ...typography.body },
  socialOverlay: { flex: 1, justifyContent: 'flex-end' },
  socialSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', alignSelf: 'center', marginBottom: spacing.lg },
  socialHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  socialIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  socialTitle: { ...typography.title, color: colors.primaryDeeper },
  socialDesc: { ...typography.body, color: colors.textMuted, marginBottom: spacing.xl },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  accountName: { ...typography.subtitle, color: colors.primaryDeeper, fontWeight: '600' },
  accountEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cancelBtn: { marginTop: spacing.xl, alignItems: 'center', padding: spacing.md, borderRadius: radius.pill, backgroundColor: 'rgba(47,74,53,0.05)' },
  cancelText: { ...typography.body, fontWeight: '600', color: colors.primaryDeeper },
});