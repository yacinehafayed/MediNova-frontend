import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';
import { useAuthStore } from './auth.store';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  date: string;
}

interface SendMessageResult {
  success: boolean;
  message?: string;
}

interface AIState {
  messages: ChatMessage[];
  activeUserId: string | null;
  sendMessage: (text: string) => Promise<SendMessageResult>;
  loadMessages: () => Promise<void>;
}

const getStorageKey = (userId: string) => `ai_messages_${userId}`;

const isValidHistory = (value: unknown): value is ChatMessage[] =>
  Array.isArray(value) &&
  value.every(
    (message) =>
      message &&
      typeof message.id === 'string' &&
      ['user', 'assistant'].includes(message.role) &&
      typeof message.content === 'string' &&
      typeof message.date === 'string'
  );

const API_URL = `${API_ENDPOINTS.ai}/chat`;

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  activeUserId: null,

  sendMessage: async (text) => {
    const content = text.trim();

    if (!content) {
      return { success: false, message: 'Veuillez saisir un message.' };
    }

    const user = useAuthStore.getState().user;

    if (!user?.token) {
      return { success: false, message: 'Votre session a expiré. Veuillez vous reconnecter.' };
    }

    try {
      let currentMessages = get().messages;

      if (get().activeUserId !== user._id) {
        const stored = await AsyncStorage.getItem(getStorageKey(user._id));
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        currentMessages = isValidHistory(parsed) ? parsed : [];

        if (useAuthStore.getState().user?._id !== user._id) {
          return { success: false, message: 'Le compte actif a changé.' };
        }

        set({ messages: currentMessages, activeUserId: user._id });
      }

      const userMessage: ChatMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content,
        date: new Date().toISOString(),
      };

      const conversation = [...currentMessages, userMessage];

      set({ messages: conversation, activeUserId: user._id });
      await AsyncStorage.setItem(getStorageKey(user._id), JSON.stringify(conversation));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          messages: conversation.slice(-20).map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Impossible de contacter MediNova IA.',
        };
      }

      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        return {
          success: false,
          message: 'Le serveur a retourné une réponse invalide.',
        };
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply.trim(),
        date: new Date().toISOString(),
      };

      if (useAuthStore.getState().user?._id !== user._id) {
        return { success: false, message: 'Le compte actif a changé.' };
      }

      const updatedMessages = [...get().messages, assistantMessage];

      set({ messages: updatedMessages, activeUserId: user._id });
      await AsyncStorage.setItem(getStorageKey(user._id), JSON.stringify(updatedMessages));

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
      };
    }
  },

  loadMessages: async () => {
    const user = useAuthStore.getState().user;

    if (!user?._id) {
      set({ messages: [], activeUserId: null });
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(getStorageKey(user._id));
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const messages = isValidHistory(parsed) ? parsed : [];

      // Ignore stale results if another account became active during the read.
      if (useAuthStore.getState().user?._id !== user._id) return;

      set({ messages, activeUserId: user._id });
    } catch (error) {
      console.error('Failed to load AI chat history:', error);
      if (useAuthStore.getState().user?._id === user._id) {
        set({ messages: [], activeUserId: user._id });
      }
    }
  },
}));

// Never keep one account's conversation visible after authentication changes.
useAuthStore.subscribe((state, previousState) => {
  if (state.user?._id !== previousState.user?._id) {
    useAIStore.setState({ messages: [], activeUserId: null });
  }
});
