import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface Analysis {
  _id: string;
  name: string;
  value: number;
  unit: string;
  reference: string;
  date: string;
  notes: string;
}

const API_URL = API_ENDPOINTS.analyses;

interface State {
  analyses: Analysis[];
  loadAnalyses: () => Promise<void>;
  addAnalysis: (a: any) => Promise<{ success: boolean; message?: string }>;
  deleteAnalysis: (id: string) => Promise<void>;
}

export const useAnalysesStore = create<State>((set, get) => ({
  analyses: [],

  loadAnalyses: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) set({ analyses: data });
    } catch (e) { console.error(e); }
  },

  addAnalysis: async (a) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return { success: false, message: 'Non connecté.' };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(a),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };
      set({ analyses: [data, ...get().analyses] });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },

  deleteAnalysis: async (id) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      set({ analyses: get().analyses.filter(a => a._id !== id) });
    } catch (e) { console.error(e); }
  },
}));