import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VitalisLogo from '@/components/VitalisLogo';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = 120;
const BRAND = 'MEDINOVA'.split('');

type Props = {
  onReveal?: () => void;
  onDone: () => void;
};

export default function SplashIntro({ onReveal, onDone }: Props) {

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(-200)).current;
  const scanOpacity = useRef(new Animated.Value(0)).current;
  const lettersAnim = useRef(BRAND.map(() => new Animated.Value(0))).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();


    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();


    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(scanOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 200,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scanOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();


    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();


    BRAND.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(1400 + i * 60),
        Animated.timing(lettersAnim[i], {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });


    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 800,
      delay: 2200,
      useNativeDriver: true,
    }).start();


    const timer = setTimeout(() => {
      onReveal?.();
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => onDone());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>


      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <LinearGradient
          colors={['#0A1929', '#061220', '#030A14']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>


      <Animated.View
        pointerEvents="none"
        style={[
          styles.scanLine,
          {
            opacity: scanOpacity,
            transform: [{ translateY: scanY }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(16, 185, 129, 0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>


      <View style={styles.center}>


        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoGlow} />
          <VitalisLogo size={LOGO_SIZE} />
        </Animated.View>


        <Animated.View
          style={[
            styles.goldLine,
            {
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 60],
              }),
            },
          ]}
        />


        <View style={styles.brandRow}>
          {BRAND.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandLetter,
                {
                  opacity: lettersAnim[i],
                  transform: [
                    {
                      translateY: lettersAnim[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>


        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          PLATEFORME DE SANTÉ INTELLIGENTE
        </Animated.Text>
      </View>


      <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
        <Text style={styles.footerText}>SÉCURISÉ · CERTIFIÉ · CONFORME RGPD</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#0A1929',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: LOGO_SIZE + 60,
    height: LOGO_SIZE + 60,
    borderRadius: (LOGO_SIZE + 60) / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  goldLine: {
    height: 2,
    backgroundColor: '#C6A15B',
    borderRadius: 1,
    marginBottom: 24,
    opacity: 0.8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 8,
    marginHorizontal: 1,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 2,
  },
});