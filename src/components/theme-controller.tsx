import React, { createContext, useMemo, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeMode = 'light' | 'dark';

type ThemeControllerValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeControllerContext = createContext<ThemeControllerValue | null>(null);

export function ThemeControllerProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode]
  );

  return (
    <ThemeControllerContext.Provider value={value}>{children}</ThemeControllerContext.Provider>
  );
}

export function useThemeController() {
  const value = React.use(ThemeControllerContext);

  if (!value) {
    throw new Error('useThemeController must be used inside ThemeControllerProvider');
  }

  return value;
}
