export const lightColors = {
  primaryAccent: '#24B8B8',
  supportPurple: '#B89AFF',
  background: '#FFFFFF',
  textPrimary: '#2F2F2F',
  textSecondary: '#5F5F5F',
  border: '#E9ECEF',
  surface: '#F8F9FA',
} as const;

export const darkColors = {
  primaryAccent: '#2DD4D4',
  supportPurple: '#C7B3FF',
  background: '#0F1517',
  textPrimary: '#F1F5F5',
  textSecondary: '#A7BCBC',
  border: '#263231',
  surface: '#1A2224',
} as const;

// Default export kept for existing static `appTheme` imports (light palette).
export const colors = lightColors;

export type ThemeColors = typeof lightColors;

