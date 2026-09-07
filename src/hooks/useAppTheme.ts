import { buildTheme } from '../theme';
import { useThemeStore } from '../store/themeStore';

export function useAppTheme() {
  const mode = useThemeStore((s) => s.mode);
  return buildTheme(mode);
}
