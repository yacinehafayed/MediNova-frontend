import { API_ENDPOINTS } from '../config/api';
import { create } from 'zustand';
import { useAuthStore } from './auth.store';

export interface ReportData {
  period: { start: string; end: string };
  stats: Record<string, { unit: string; count: number; min: number; max: number; avg: number }>;
  totalMeasures: number;
  totalAnalyses: number;
}

const API_URL = API_ENDPOINTS.reports;

interface State {
  report: ReportData | null;
  loadReport: (start?: string, end?: string) => Promise<void>;
}

export const useReportsStore = create<State>((set) => ({
  report: null,

  loadReport: async (start, end) => {
    try {
      const token = useAuthStore.getState().user?.token;
      if (!token) return;
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const res = await fetch(`${API_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) set({ report: await res.json() });
    } catch (e) { console.error(e); }
  },
}));