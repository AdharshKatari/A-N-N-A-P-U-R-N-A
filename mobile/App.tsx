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
import { initializeOfflineSync, stopOfflineSync } from './src/services/offlineSync';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { QueryProvider } from './src/context/QueryProvider';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    // Initialize offline sync with NetInfo listener
    initializeOfflineSync({
      onSyncStart: () => console.log('[OfflineSync] Sync started'),
      onSyncProgress: (completed, total) => console.log(`[OfflineSync] Progress: ${completed}/${total}`),
      onSyncComplete: (result) => {
        console.log(`[OfflineSync] Complete: ${result.success} success, ${result.failed} failed`);
        updateSyncStatus();
      },
      onSyncError: (error) => console.error('[OfflineSync] Error:', error),
    });

    // Initial status check
    updateSyncStatus();

    return () => {
      stopOfflineSync();
    };
  }, [fontsLoaded]);

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

  return <AppNavigator />;
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
