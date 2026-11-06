import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = API_ENDPOINTS.auth;

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  notificationsEnabled?: boolean;
  remindersEnabled?: boolean;
  biometricEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  socialLogin: (provider: 'Google' | 'Apple', email: string, name: string) => Promise<{ success: boolean; message?: string }>;
  updateSettings: (settings: { notificationsEnabled?: boolean; remindersEnabled?: boolean; biometricEnabled?: boolean }) => Promise<{ success: boolean; message?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,


  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || 'Erreur.' };

      const user: User = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
        notificationsEnabled: data.notificationsEnabled ?? true,
        remindersEnabled: data.remindersEnabled ?? true,
        biometricEnabled: data.biometricEnabled ?? false,
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Impossible de contacter le serveur.' };
    }
  },


  register: async (data) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || "Erreur d'inscription." };

      const user: User = {
        _id: result._id,
        name: result.name,
        email: result.email,
        token: result.token,
        notificationsEnabled: true,
        remindersEnabled: true,
        biometricEnabled: false,
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Impossible de contacter le serveur.' };
    }
  },


  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },


  loadUser: async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const user: User = JSON.parse(stored);
        set({ user, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },


  updateProfile: async (data) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return { success: false, message: 'Non connecté.' };

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Erreur.' };

      const updatedUser: User = { ...currentUser, ...result };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return { success: false, message: 'Non connecté.' };

      const response = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const result = await response.json();
      return response.ok ? { success: true } : { success: false, message: result.message };
    } catch (err) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },


  forgotPassword: async (email) => {
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };
      return { success: true, message: data.message, code: data.resetCode };
    } catch (e) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },


  resetPassword: async (email, code, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      return res.ok ? { success: true } : { success: false, message: data.message };
    } catch (e) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },


  socialLogin: async (provider, email, name) => {
    try {
      const res = await fetch(`${API_URL}/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email, name }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };

      const user: User = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
        notificationsEnabled: true,
        remindersEnabled: true,
        biometricEnabled: false,
      };
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },


  updateSettings: async (settings) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return { success: false, message: 'Non connecté.' };

      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };

      const updatedUser: User = { ...currentUser, ...data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },
}));