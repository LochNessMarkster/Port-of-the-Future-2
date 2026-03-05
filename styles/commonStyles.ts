
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const colors = {
  light: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    primary: '#1D3557',
    secondary: '#457B9D',
    accent: '#E63946',
    border: '#E0E0E0',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#F59E0B',
  },
  dark: {
    background: '#0A0A0A',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#457B9D',
    secondary: '#A8DADC',
    accent: '#F1FAEE',
    border: '#2A2A2A',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#FBBF24',
  },
};
