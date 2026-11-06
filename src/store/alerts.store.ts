import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface Alert {
  _id: string;
  title: string;
  message: string;
  level: 'warning' | 'danger';
  read: boolean;
  createdAt: string;
}

const API_URL = API_ENDPOINTS.alerts;

interface AlertState {
  alerts: Alert[];
  loadAlerts: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  checkThreshold: (type: string, value: number) => Promise<void>;
}

export const useAlertsStore = create<AlertState>((set, get) => ({
  alerts: [],

  loadAlerts: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) set({ alerts: data });
    } catch (e) { console.error(e); }
  },

  markRead: async (id) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      await fetch(`${API_URL}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ alerts: get().alerts.map(a => a._id === id ? { ...a, read: true } : a) });
    } catch (e) { console.error(e); }
  },

  checkThreshold: async (type, value) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const response = await fetch(`${API_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, value }),
      });

      const data = await response.json();
      if (data.alert) {
        set({ alerts: [data.alert, ...get().alerts] });
      }
    } catch (e) { console.error(e); }
  },
}));