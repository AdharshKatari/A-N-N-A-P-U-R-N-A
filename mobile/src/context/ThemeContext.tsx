import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'annapurna.theme';
const ThemeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: 'light', toggle: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    }).catch(() => undefined);
  }, []);
  const value = useMemo(() => ({
    mode,
    toggle: () => setMode((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    }),
  }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
