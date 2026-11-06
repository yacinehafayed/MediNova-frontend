export const colors = {

  bg: '#E9F0EA',
  bgDeep: '#CFDCCF',
  surface: 'rgba(255,255,255,0.72)',
  surfaceSolid: '#F6FAF6',
  glassBorder: 'rgba(255,255,255,0.85)',


  primary: '#5E7F63',
  primaryDark: '#2F4A35',
  primaryDeeper: '#16251A',
  primarySoft: '#DCE8DC',
  accent: '#C6A15B', // touche dorée premium


  text: '#16251A',
  textMuted: '#6B7C6E',
  textOnDark: '#FFFFFF',


  danger: '#D9534F',
  success: '#4E9F6A',
  info: '#B9C8DC',
};

export const gradients = {
  background: ['#F3F8F3', '#DCE8DC', '#BFD2C0'] as const,
  primary: ['#3C5C42', '#1E3324'] as const,
  gold: ['#D9B974', '#B08A3E'] as const,
  card: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.55)'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 };

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.8 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
};

export const shadows = {
  soft: {
    shadowColor: '#2F4A35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  strong: {
    shadowColor: '#16251A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
  },
};

export const theme = { colors, gradients, spacing, radius, typography, shadows };
export default theme;