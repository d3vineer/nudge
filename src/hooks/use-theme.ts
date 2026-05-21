import { useThemeController } from '@/components/theme-controller';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const { mode } = useThemeController();

  return Colors[mode];
}
