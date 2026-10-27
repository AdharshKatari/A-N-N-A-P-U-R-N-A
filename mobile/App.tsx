import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView as SafeAreaFrame } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, ActivityIndicator, Platform, StyleSheet } from 'react-native';

import {
  useFonts,
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_200ExtraLight_Italic,
  PlusJakartaSans_300Light_Italic,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium_Italic,
  PlusJakartaSans_600SemiBold_Italic,
  PlusJakartaSans_700Bold_Italic,
  PlusJakartaSans_800ExtraBold_Italic,
} from '@expo-google-fonts/plus-jakarta-sans';

import AppNavigator from './src/navigation/AppNavigator';
import PwaInstallModal from './src/components/PwaInstallModal';
import { initializeOfflineSync, stopOfflineSync } from './src/services/offlineSync';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { QueryProvider } from './src/context/QueryProvider';
import { LanguageProvider } from './src/context/LanguageContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';

// Keep the splash screen visible while we fetch resources
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_200ExtraLight_Italic,
    PlusJakartaSans_300Light_Italic,
    PlusJakartaSans_400Regular_Italic,
    PlusJakartaSans_500Medium_Italic,
    PlusJakartaSans_600SemiBold_Italic,
    PlusJakartaSans_700Bold_Italic,
    PlusJakartaSans_800ExtraBold_Italic,
  });

  const [syncStatus, setSyncStatus] = useState<{ isOnline: boolean; pendingCount: number }>({
    isOnline: true,
    pendingCount: 0,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && Platform.OS !== 'web') {
      try {
        await SplashScreen.hideAsync();
      } catch (_) {}
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    initializeOfflineSync();
    updateSyncStatus();

    const interval = setInterval(updateSyncStatus, 10000);

    return () => {
      stopOfflineSync();
      clearInterval(interval);
    };
  }, [fontsLoaded]);

  // Progressive Web App (PWA) Manifest & Service Worker Registration
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Ensure PWA Meta & Manifest tags in <head>
    if (typeof document !== 'undefined') {
      const head = document.head;

      if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/manifest.json';
        head.appendChild(link);
      }

      if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#145C2E';
        head.appendChild(meta);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-capable';
        meta.content = 'yes';
        head.appendChild(meta);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const meta = document.createElement('meta');
        meta.name = 'apple-mobile-web-app-status-bar-style';
        meta.content = 'black-translucent';
        head.appendChild(meta);
      }

      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        const link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        link.href = '/icons/icon-192.png';
        head.appendChild(link);
      }
    }

    // 2. Register Service Worker for offline PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  const updateSyncStatus = async () => {
    try {
      const { getSyncStatus } = await import('./src/services/offlineSync');
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Failed to get sync status:', err);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <SafeAreaFrame
            edges={Platform.OS === 'android' ? ['top'] : []}
            style={styles.appFrame}
            onLayout={onLayoutRootView}
          >
            <QueryProvider>
              <AuthProvider>
                <NavigationContainer>
                  <ThemedStatusBar />
                  <AppWithAuth />
                </NavigationContainer>
              </AuthProvider>
            </QueryProvider>
          </SafeAreaFrame>
        </SafeAreaProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

function ThemedStatusBar() {
  const { mode } = useAppTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

function AppWithAuth() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator size="large" color="#4A803D" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <PwaInstallModal delayMs={2400} />
    </>
  );
}

const styles = StyleSheet.create({
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 960 : undefined,
    alignSelf: 'center',
    backgroundColor: '#FAF9F5',
  },
  authLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
