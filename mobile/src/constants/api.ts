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
  const envUrl = (globalThis as any).__EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, ''); // strip trailing slashes

  // 2. Web browser: use current host / origin
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      // If we are served from the same server (port 8000, 80, 443, or reverse proxy), use origin
      if (window.location.port === '8000' || !window.location.port || window.location.port === '80' || window.location.port === '443') {
        return window.location.origin;
      }
      // If served from Expo dev server (e.g. 8081, 19006), target the backend on port 8000
      return `${window.location.protocol}//${window.location.hostname}:8000`;
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
