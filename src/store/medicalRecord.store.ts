import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface MedicalRecord {
  _id: string;
  bloodType: string;
  allergies: string[];
  chronicDiseases: string[];
  medicalHistory: string;
  currentTreatments: string;
  doctor: { name: string; phone: string; specialty: string };
  documents: any[];
}

const API_URL = API_ENDPOINTS.medicalRecords;

interface RecordState {
  record: MedicalRecord | null;
  loadRecord: () => Promise<void>;
  updateRecord: (data: Partial<MedicalRecord>) => Promise<{ success: boolean; message?: string }>;
}

export const useMedicalRecordStore = create<RecordState>((set) => ({
  record: null,

  loadRecord: async () => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) set({ record: data });
    } catch (e) { console.error(e); }
  },

  updateRecord: async (data) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return { success: false, message: 'Non connecté.' };
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, message: result.message };
      set({ record: result });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Erreur réseau.' };
    }
  },
}));