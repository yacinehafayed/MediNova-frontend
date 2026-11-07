import { router } from 'expo-router';
import EmergencyModal from '@/components/EmergencyModal';

export default function UrgencyScreen() {
  return (
    <EmergencyModal
      visible={true}
      onClose={() => router.back()}
    />
  );
}
