export const Colors = {
  background: '#1A2B42',
  panelBg: 'rgba(36, 59, 90, 0.75)',
  panelBgSolid: '#243B5A',
  accent: '#00deec',
  accentDim: 'rgba(0, 222, 236, 0.15)',
  accentBorder: 'rgba(0, 222, 236, 0.35)',
  error: '#ff6b6b',
  errorDim: 'rgba(220, 50, 50, 0.08)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.1)',
  cardBronze: '#c48b5b',
  cardSilver: '#d7e6f2',
  cardGold: '#e8c060',
  cardPlatinum: '#8ff5ff',
};

export const CardColors: Record<string, { text: string; border: string; glow: string }> = {
  bronze: { text: '#c48b5b', border: 'rgba(160, 105, 62, 0.48)', glow: 'rgba(120, 70, 28, 0.14)' },
  silver: { text: '#d7e6f2', border: 'rgba(205, 225, 238, 0.46)', glow: 'rgba(180, 210, 230, 0.16)' },
  gold: { text: '#e8c060', border: 'rgba(200, 160, 30, 0.55)', glow: 'rgba(170, 120, 0, 0.2)' },
  platinum: { text: '#8ff5ff', border: 'rgba(0, 222, 236, 0.65)', glow: 'rgba(0, 222, 236, 0.28)' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};
