
import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import { useAlertsStore } from './alerts.store';

export type MeasurementType =
  | 'weight'
  | 'blood_pressure'
  | 'heart_rate'
  | 'blood_sugar';

export interface Measurement {
  _id: string;
  type: MeasurementType;
  value?: number;
  systolic?: number;
  diastolic?: number;
  mealTiming?: 'fasting' | 'after_meal';
  unit: string;
  date: string;
}

export type NewMeasurement =
  | {
      type: 'blood_pressure';
      systolic: number;
      diastolic: number;
      unit: string;
    }
  | {
      type: 'blood_sugar';
      value: number;
      mealTiming: 'fasting' | 'after_meal';
      unit: string;
    }
  | {
      type: 'weight' | 'heart_rate';
      value: number;
      unit: string;
};

const API_URL = API_ENDPOINTS.measurements;

interface HealthState {
  measurements: Measurement[];
  isLoading: boolean;
  addMeasurement: (
    m: NewMeasurement
  ) => Promise<{ success: boolean; message?: string }>;
  deleteMeasurement: (id: string) => Promise<void>;
  loadMeasurements: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  measurements: [],
  isLoading: false,

  addMeasurement: async (m) => {
    console.log('ADD MEASUREMENT CALLED:', m);
    try {
      const token = useAuthStore.getState().user?.token;

      if (!token) {
        return { success: false, message: 'Non connecté.' };
      }

      console.log('MEASUREMENT PAYLOAD:', JSON.stringify(m));
      console.log('MEASUREMENT API:', API_URL);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(m),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Impossible d’ajouter la mesure.',
        };
      }

      set({ measurements: [data, ...get().measurements] });

      await useAlertsStore.getState().checkThreshold(
        m.type === 'blood_pressure'
          ? {
              type: 'blood_pressure',
              systolic: m.systolic,
              diastolic: m.diastolic,
            }
          : m.type === 'blood_sugar'
            ? {
                type: 'blood_sugar',
                value: m.value,
                mealTiming: m.mealTiming,
              }
            : {
                type: m.type,
                value: m.value,
              }
      );

      return { success: true };
    } catch (e) {
      return {
        success: false,
        message: 'Impossible de contacter le serveur.',
      };
    }
  },

  deleteMeasurement: async (id) => {
    try {
      const token = useAuthStore.getState().user?.token;

      if (!token) return;

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      set({
        measurements: get().measurements.filter((m) => m._id !== id),
      });
    } catch (e) {
      console.error(e);
    }
  },

  loadMeasurements: async () => {
    try {
      const token = useAuthStore.getState().user?.token;

      if (!token) return;

      set({ isLoading: true });

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      set({ measurements: data });
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
