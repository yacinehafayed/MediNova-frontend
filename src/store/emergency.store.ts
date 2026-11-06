import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface EmergencyInfo {
  _id: string;
  contactName: string;
  contactPhone: string;
  bloodType: string;
  allergies: string;
  importantTreatments: string;
}

const API_URL = API_ENDPOINTS.emergency;

interface State {
  info: EmergencyInfo | null;
  loadInfo: () => Promise<void>;
  updateInfo: (data: Partial<EmergencyInfo>) => Promise<{ success: boolean }>;
}

export const useEmergencyStore = create<State>((set) => ({
  info: null,

  loadInfo: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) set({ info: await res.json() });
    } catch (e) { console.error(e); }
  },

  updateInfo: async (data) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return { success: false };
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        set({ info: await res.json() });
        return { success: true };
      }
      return { success: false };
    } catch (e) { return { success: false }; }
  },
}));