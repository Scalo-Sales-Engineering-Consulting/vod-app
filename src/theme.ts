// Central design tokens for the VOD app — kept in sync with the Figma file.
export const colors = {
  background: '#0B0B0F',
  surface: '#16161D',
  surfaceAlt: '#1F1F29',
  border: '#2A2A36',
  primary: '#5CE38B', // light green accent
  primaryDark: '#2FB866',
  onPrimary: '#06210F', // near-black green — text/icons on top of `primary` fills (WCAG-safe)
  text: '#FFFFFF',
  textMuted: '#AEAEB9', // secondary text — ~8:1 on dark
  textFaint: '#8B8B97', // tertiary text — raised from #6B6B78 to clear AA 4.5:1 on dark surfaces
  rating: '#F5C518', // IMDb-style gold
  overlay: 'rgba(11,11,15,0.7)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};
