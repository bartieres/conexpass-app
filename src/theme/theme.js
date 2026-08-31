// Paleta oficial ConexPass — manter consistência com web/landing
export const colors = {
  blue: '#2B6CE0',
  blueDark: '#1B3FAE',
  blueLight: '#3B82F6',
  navy: '#0F1115',
  white: '#FFFFFF',
  bg: '#F5F7FB',
  card: '#FFFFFF',
  border: '#E7EAF3',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  star: '#FBBF24',
  chipBg: '#EEF2FF',
  overlay: 'rgba(15,17,21,0.55)',
};

export const gradients = {
  primary: [colors.blue, colors.blueDark],
  hero: [colors.blueLight, colors.blue],
};

export const spacing = (n) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadow = {
  shadowColor: '#0F1115',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  h2: { fontSize: 20, fontWeight: '800', color: colors.text },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, fontWeight: '400', color: colors.text },
  muted: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  small: { fontSize: 12, fontWeight: '400', color: colors.textLight },
};
