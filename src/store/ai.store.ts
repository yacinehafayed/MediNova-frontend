import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  date: string;
}

interface AIState {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  loadMessages: () => Promise<void>;
}

const KB: Record<string, string> = {
  tension: "Une tension artérielle normale se situe entre 90/60 et 120/80 mmHg. Si elle dépasse 140/90, consultez un médecin.",
  pression: "Une tension artérielle normale se situe entre 90/60 et 120/80 mmHg.",
  diabète: "La glycémie à jeun doit être entre 0,7 et 1,1 g/L. Au-delà, il s'agit d'une hyperglycémie.",
  glycémie: "La glycémie à jeun normale est de 0,7 à 1,1 g/L. Surveillez votre alimentation si elle est élevée.",
  coeur: "La fréquence cardiaque au repos est normalement entre 60 et 100 bpm.",
  poids: "Un IMC normal se situe entre 18,5 et 25. Calculez : poids (kg) / taille² (m²).",
  sommeil: "Un adulte a besoin de 7 à 9 heures de sommeil par nuit pour être en bonne santé.",
  mal: "Pour les maux de tête, hydratez-vous et reposez-vous. Si la douleur persiste, consultez.",
};

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],

  sendMessage: async (text) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, date: new Date().toISOString() };
    set({ messages: [...get().messages, userMsg] });

    await new Promise(r => setTimeout(r, 1200));

    const lower = text.toLowerCase();
    let botResponse = "Je suis votre assistant MediNova. Je ne remplace pas un médecin, mais je peux vous donner des infos générales. Consultez un professionnel pour tout symptôme inquiétant.";

    for (const key in KB) {
      if (lower.includes(key)) {
        botResponse = KB[key];
        break;
      }
    }

    if (lower.includes('bonjour') || lower.includes('salut')) {
      botResponse = "Bonjour ! Comment puis-je vous aider aujourd'hui concernant votre santé ?";
    }

    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: botResponse, date: new Date().toISOString() };
    const newMessages = [...get().messages, botMsg];
    set({ messages: newMessages });
    await AsyncStorage.setItem('ai_messages', JSON.stringify(newMessages));
  },

  loadMessages: async () => {
    try {
      const stored = await AsyncStorage.getItem('ai_messages');
      if (stored) set({ messages: JSON.parse(stored) });
    } catch (e) { console.error(e); }
  },
}));