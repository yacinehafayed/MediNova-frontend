import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface TakenRecord {
  date: string;
  time: string;
  status: 'taken' | 'missed';
}

export interface Medication {
  _id: string;
  name: string;
  description: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string;
  taken: TakenRecord[];
}

const API_URL = API_ENDPOINTS.medications;

interface MedState {
  medications: Medication[];
  loadMedications: () => Promise<void>;
  addMedication: (data: any) => Promise<{ success: boolean; message?: string }>;
  markTaken: (id: string, time: string, status: 'taken' | 'missed') => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
}

export const useMedicationsStore = create<MedState>((set, get) => ({
  medications: [],

  loadMedications: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) set({ medications: data });
    } catch (e) { console.error(e); }
  },

  addMedication: async (data) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return { success: false, message: 'Non connecté.' };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, message: result.message || `Erreur ${res.status}` };
      set({ medications: [result, ...get().medications] });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: `Impossible de joindre le serveur` };
    }
  },

  markTaken: async (id, time, status) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch(`${API_URL}/${id}/mark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString(), time, status }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ medications: get().medications.map(m => m._id === id ? data : m) });
      }
    } catch (e) { console.error(e); }
  },

  deleteMedication: async (id) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ medications: get().medications.filter(m => m._id !== id) });
    } catch (e) { console.error(e); }
  },
}));