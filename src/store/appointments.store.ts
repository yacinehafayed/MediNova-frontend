import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import { useNotificationsStore } from './notifications.store';

export interface Appointment {
  _id: string;
  doctor: string;
  specialty: string;
  date: string;
  location: string;
  mode: 'visio' | 'cabinet';
  notes?: string;
}

const API_URL = API_ENDPOINTS.appointments;

interface AppointmentState {
  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, '_id'>) => Promise<{ success: boolean; message?: string }>;
  deleteAppointment: (id: string) => Promise<void>;
  loadAppointments: () => Promise<void>;
}

export const useAppointmentsStore = create<AppointmentState>((set, get) => ({
  appointments: [],

  addAppointment: async (a) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return { success: false, message: 'Non connecté.' };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(a),
      });

      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message };

      set({ appointments: [data, ...get().appointments] });
      const notificationStore = useNotificationsStore.getState();
      
      await notificationStore.checkReminders();
      await notificationStore.loadNotifications();
      return { success: true };

    } catch (e) {
      return { success: false, message: 'Impossible de contacter le serveur.' };
    }
  },

  deleteAppointment: async (id) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ appointments: get().appointments.filter((a) => a._id !== id) });
    } catch (e) {
      console.error(e);
    }
  },

  loadAppointments: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ appointments: data });
      }
    } catch (e) {
      console.error(e);
    }
  },
}));