import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';

export default function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      Animated.timing(slideAnim, {
        toValue: connected ? -100 : 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
    return () => unsubscribe();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline" size={20} color="#FFF" />
      <Text style={styles.text}>Mode hors ligne - Certaines fonctions sont indisponibles</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: colors.danger, paddingTop: 50, paddingBottom: 12,
    paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: 8, zIndex: 9999,
  },
  text: { color: '#FFF', fontSize: 13, fontWeight: '600', flex: 1 },
});