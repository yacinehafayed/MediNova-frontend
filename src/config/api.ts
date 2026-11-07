const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not configured. Check your .env file.'
  );
}

export const API_URL = API_BASE_URL.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  auth: `${API_URL}/auth`,
  appointments: `${API_URL}/appointments`,
  alerts: `${API_URL}/alerts`,
  analyses: `${API_URL}/analyses`,
  emergency: `${API_URL}/emergency`,
  measurements: `${API_URL}/measurements`,
  medicalRecords: `${API_URL}/medical-records`,
  medications: `${API_URL}/medications`,
  notifications: `${API_URL}/notifications`,
  reports: `${API_URL}/reports`,
  ai: `${API_URL}/ai`,
};