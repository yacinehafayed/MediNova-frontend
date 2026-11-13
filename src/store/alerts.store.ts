
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

export type AlertMeasurement =
  | {
      type: 'blood_pressure';
      systolic: number;
      diastolic: number;
    }
  | {
      type: 'blood_sugar';
      value: number;
      mealTiming: 'fasting' | 'after_meal';
    }
  | {
      type: 'heart_rate' | 'weight';
      value: number;
    };

const API_URL = API_ENDPOINTS.alerts;

interface AlertState {
  alerts: Alert[];
  loadAlerts: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  checkThreshold: (measurement: AlertMeasurement) => Promise<void>;
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

      if (response.ok) {
        set({ alerts: data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  
  markRead: async (id) => {
    const token = useAuthStore.getState().user?.token;
    if (!token) return;

    const previousAlerts = get().alerts;
    set({ alerts: previousAlerts.map((alert) => alert._id === id ? { ...alert, read: true } : alert ), });

    try {
      const response = await fetch(`${API_URL}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, },
      });

      if (!response.ok) {
        set({ alerts: previousAlerts });
        await get().loadAlerts();
      }
    } catch {
      set({ alerts: previousAlerts });
      await get().loadAlerts();
    }
  },


  checkThreshold: async (measurement) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const response = await fetch(`${API_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(measurement),
      });

      const data = await response.json();

      if (response.ok && data.alert) {
        set({ alerts: [ data.alert, ...get().alerts.filter( (alert) => alert._id !== data.alert._id ),], });
      }
    } catch (e) {
      console.error(e);
    }
  },
}));
