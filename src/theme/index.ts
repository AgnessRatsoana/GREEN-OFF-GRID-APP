import { colors, darkColors, lightColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const appTheme = {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} as const;

export type AppTheme = Omit<typeof appTheme, 'colors'> & {
  colors: typeof lightColors | typeof darkColors;
};

export type ThemeMode = 'light' | 'dark';

export function buildTheme(mode: ThemeMode): AppTheme {
  return {
    colors: mode === 'dark' ? darkColors : lightColors,
    radius,
    shadows,
    spacing,
    typography,
  };
}