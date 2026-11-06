import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface AppNotification {
  _id: string;
  type: 'alert' | 'appointment' | 'medication' | 'info';
  title: string;
  message: string;
  level: 'info' | 'warning' | 'danger';
  read: boolean;
  createdAt: string;
}

const API_URL = API_ENDPOINTS.notifications;

interface NotifState {
  notifications: AppNotification[];
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  checkReminders: () => Promise<void>;
}

export const useNotificationsStore = create<NotifState>((set, get) => ({
  notifications: [],

  loadNotifications: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        set({ notifications: data });
      }
    } catch (e) {}
  },

  markAsRead: async (id) => {
    set({
      notifications: get().notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
    });

    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;

      const res = await fetch(`${API_URL}/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        set({
          notifications: get().notifications.map((n) =>
            n._id === id ? { ...n, read: false } : n
          ),
        });
      }
    } catch {
      set({
        notifications: get().notifications.map((n) =>
          n._id === id ? { ...n, read: false } : n
        ),
      });
    }
  },

  markAllAsRead: async () => {
    set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) });
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      await fetch(`${API_URL}/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  },


  deleteNotification: async (id) => {
    // Suppression visuelle immédiate (optimiste)
    set({ notifications: get().notifications.filter((n) => n._id !== id) });

    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      get().loadNotifications();
    }
  },


  checkReminders: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      await fetch(`${API_URL}/check-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

    } catch {}
  },
}));