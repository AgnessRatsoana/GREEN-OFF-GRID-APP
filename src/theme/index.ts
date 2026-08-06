import { colors } from './colors';
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

export type AppTheme = typeof appTheme;
