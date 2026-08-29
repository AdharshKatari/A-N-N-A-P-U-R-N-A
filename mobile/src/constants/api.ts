/**
 * API Configuration
 *
 * Switches between local dev server and production backend automatically.
 * Backend port defaults to 8000 (FastAPI Uvicorn).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  // 1. Explicit env var takes highest priority
  const envUrl = (global as any).__EXPO_PUBLIC_API_URL ?? process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, ''); // strip trailing slashes

  // 2. Web browser: use current host on port 8000
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
  }

  // 3. Auto-detect Expo host IP for physical devices running Expo Go
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).linkingUri;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split('/')[0].split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  // 4. Android emulator needs 10.0.2.2 to reach host localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // 5. Default fallback
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveBaseUrl();

// ─── Request Defaults ──────────────────────────────────

export const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export const REQUEST_TIMEOUT_MS = 15_000;

// ─── Debug Logging (dev only) ──────────────────────────

if (__DEV__) {
  console.log(`[API] Base URL: ${API_BASE_URL}`);
}
