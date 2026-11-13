import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, gradients, darkGradients, radius, shadows, spacing, typography } from '@/constants/theme';
import { useAIStore } from '@/store/ai.store';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import Markdown from 'react-native-markdown-display';

const { width } = Dimensions.get('window');

export default function Assistant() {
  const { messages = [], sendMessage, loadMessages } = useAIStore();
  const userId = useAuthStore((state) => state.user?._id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isDark = useThemeStore((s) => s.isDark);
  const palette = isDark ? darkColors : colors;
  const activeGradients = isDark ? darkGradients : gradients;

  useEffect(() => {
    loadMessages();
  }, [loadMessages, userId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSend = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim() || isTyping) return;

    setInput('');
    setIsTyping(true);

    try {
      const result = await sendMessage(messageToSend);

      if (!result.success) {
        Alert.alert('MediNova IA', result.message || 'Une erreur est survenue.');
      }

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      Alert.alert('MediNova IA', 'Une erreur inattendue est survenue.');
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Quels sont les symptômes de la grippe ?",
    "Comment baisser ma tension artérielle ?",
    "Explique-moi le diabète de type 2",
  ];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: palette.bg }]} edges={['top']}>
      <LinearGradient colors={activeGradients.background} style={styles.flex}>
        <View style={[ styles.orb, { top: -100, left: -80, width: 280, height: 280, backgroundColor: isDark ? 'rgba(143,175,209,0.10)' : 'rgba(255,255,255,0.55)', }, ]}/>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient colors={activeGradients.primary} style={styles.avatarAI}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </LinearGradient>
              <View>
                <Text style={[styles.headerTitle, { color: palette.primaryDeeper }]}>MediNova IA</Text>
                <View style={styles.statusRow}>
                  <Animated.View style={[styles.statusDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.statusText}>En ligne</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.menuBtn, isDark && { backgroundColor: palette.surface },]}>
              <Ionicons name="ellipsis-horizontal" size={20} color={palette.primaryDark} />
            </TouchableOpacity>
          </View>

          {/* CHAT */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {(!messages || messages.length === 0) && (
              <View style={styles.welcomeContainer}>
                <LinearGradient colors={activeGradients.primary} style={styles.welcomeIcon}>
                  <Ionicons name="medical" size={40} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.welcomeTitle, { color: palette.primaryDeeper }]}>Bonjour, je suis MediNova IA</Text>
                <Text style={[styles.welcomeSubtitle, { color: palette.textMuted }]}>
                  Posez-moi une question sur votre santé, vos symptômes ou vos médicaments. Je suis là pour vous aider.
                </Text>

                <View style={styles.suggestionsContainer}>
                  {suggestions.map((s, i) => (
                    <TouchableOpacity key={i} style={[ styles.suggestionBtn, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]} onPress={() => handleSend(s)}>
                      <Ionicons name="chatbubble-outline" size={16} color={palette.primary} />
                      <Text style={[styles.suggestionText, { color: palette.primaryDark }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(messages || []).map((m) => (
              <View key={m.id} style={[styles.msgWrap, m.role === 'user' ? styles.msgUser : styles.msgBot]}>
                {m.role === 'assistant' && (
                  <View style={[ styles.botIcon, isDark && { backgroundColor: palette.primarySoft }, ]}>
                    <Ionicons name="sparkles" size={14} color={palette.primary} />
                  </View>
                )}
                <BlurView intensity={m.role === 'user' ? 0 : isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.msgBubble,
                    m.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                    m.role === 'user'
                      ? { backgroundColor: isDark ? '#456B4D' : colors.primaryDark }
                      : isDark ? {
                        backgroundColor: palette.surface,
                        borderColor: palette.glassBorder,
                      } : {}, 
                  ]}
                >
                  {m.role === 'user' ? (
                    <Text style={[styles.msgText, { color: '#FFFFFF' }]}>
                      {m.content}
                    </Text>
                  ) : (
                    <Markdown
                      style={{
                        body: { color: palette.text, fontSize: 15, lineHeight: 22,},
                        paragraph: { marginTop: 0, marginBottom: 12,},
                        strong: { fontWeight: 'bold', color: palette.primaryDeeper,},
                        em: { fontStyle: 'italic',},
                        heading1: { color: palette.primaryDeeper, fontSize: 22, fontWeight: 'bold',},
                        heading2: { color: palette.primaryDeeper, fontSize: 19, fontWeight: 'bold',},
                        bullet_list: { marginBottom: 8,},
                        ordered_list: { marginBottom: 8,},
                        list_item: { marginBottom: 4,},
                        link: { color: isDark ? '#8FB5FF' : '#356BB5',},
                        code_inline: { backgroundColor: isDark ? '#293E30' : '#E8EEE8', color: palette.text,},
                      }}
                    >
                      {m.content}
                    </Markdown>
                  )}
                </BlurView>
              </View>
            ))}

            {isTyping && (
              <View style={[styles.msgWrap, styles.msgBot]}>
                <View style={styles.botIcon}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[ styles.msgBubble, styles.bubbleBot, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
                  <Text style={[styles.typingText, { color: palette.textMuted }]}>MediNova IA réfléchit...</Text>
                </BlurView>
              </View>
            )}
          </ScrollView>


          <View style={styles.inputContainer}>
            <BlurView intensity={isDark ? 25 : 60} tint={isDark ? 'dark' : 'light'} style={[ styles.inputArea, isDark && { backgroundColor: palette.surface, borderColor: palette.glassBorder, }, ]}>
              <TouchableOpacity style={styles.attachBtn}>
                <Ionicons name="add" size={24} color={palette.textMuted} />
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="Posez votre question..."
                placeholderTextColor={palette.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
              />

              <TouchableOpacity onPress={() => handleSend()} disabled={!input.trim()}>
                <LinearGradient
                  colors={ input.trim() ? activeGradients.primary  : isDark  ? ['#35443A', '#29372E']  : ['#E2E8F0', '#CBD5E1']}
                  style={styles.sendBtn}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
            <Text style={[styles.disclaimerText, { color: palette.textMuted }]}>
              MediNova IA peut faire des erreurs. Vérifiez les informations importantes.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarAI: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.soft
  },
  headerTitle: { ...typography.subtitle, fontWeight: '800', color: colors.primaryDeeper, fontSize: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  menuBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
    ...shadows.soft
  },

  scroll: { padding: spacing.lg, paddingBottom: 20 },

  welcomeContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: spacing.lg },
  welcomeIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg, ...shadows.strong
  },
  welcomeTitle: { ...typography.title, color: colors.primaryDeeper, textAlign: 'center', marginBottom: 8 },
  welcomeSubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },

  suggestionsContainer: { width: '100%', gap: 10 },
  suggestionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.soft
  },
  suggestionText: { ...typography.body, color: colors.primaryDark, fontWeight: '500', flex: 1 },

  msgWrap: { marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'flex-end' },
  msgUser: { justifyContent: 'flex-end' },
  msgBot: { justifyContent: 'flex-start' },
  botIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 4
  },
  msgBubble: {
    maxWidth: '80%', padding: spacing.md, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  bubbleUser: { borderBottomRightRadius: 6 },
  bubbleBot: { borderBottomLeftRadius: 6, backgroundColor: 'rgba(255,255,255,0.85)' },
  msgText: { ...typography.body, lineHeight: 22, fontSize: 15 },
  textUser: { color: '#FFF' },
  textBot: { color: colors.text },
  typingText: { ...typography.body, color: colors.textMuted, fontStyle: 'italic' },

  inputContainer: { paddingHorizontal: spacing.lg, paddingBottom: 130 },
  inputArea: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, borderColor: '#FFF',
    ...shadows.strong
  },
  attachBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, ...typography.body, maxHeight: 100, paddingHorizontal: 8, paddingVertical: 12 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  disclaimerText: {
    ...typography.caption, color: colors.textMuted,
    textAlign: 'center', marginTop: 12, fontSize: 10
  },
});