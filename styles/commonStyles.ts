
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Port of the Future 2026 Theme - Maritime colors (lighter, ocean-inspired)
export const colors = {
  light: {
    background: '#F0F7FC', // Light ocean blue background
    card: '#FFFFFF',
    text: '#0A2540', // Deep navy text
    textSecondary: '#4A6B8A', // Muted blue-gray
    primary: '#0066CC', // Deep ocean blue
    secondary: '#00A3E0', // Bright maritime blue
    accent: '#FF8C42', // Warm coral/orange
    highlight: '#FFB84D', // Golden sand
    border: '#C5D9E8',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    background: '#0A1929', // Deep ocean night
    card: '#1A2F42', // Dark maritime blue
    text: '#E3F2FD', // Light blue-white
    textSecondary: '#90B4CE', // Soft blue-gray
    primary: '#4A9EFF', // Bright ocean blue
    secondary: '#00C4FF', // Cyan blue
    accent: '#FF8C42', // Warm coral
    highlight: '#FFB84D', // Golden sand
    border: '#2D4A5E',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
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
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
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

// Legacy colors for backward compatibility
export const legacyColors = {
  primary: '#0066CC',
  secondary: '#00A3E0',
  accent: '#64B5F6',
  background: '#0A1929',
  backgroundAlt: '#1A2F42',
  text: '#E3F2FD',
  grey: '#90B4CE',
  card: '#1A2F42',
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: legacyColors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: legacyColors.backgroundAlt,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: legacyColors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: legacyColors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: legacyColors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: legacyColors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: legacyColors.backgroundAlt,
    borderColor: legacyColors.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: "white",
  },
});
