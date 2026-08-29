/**
 * API Configuration
 *
 * Switches between local dev server and production backend automatically.
 *
 * Usage:
 *   - Local dev:  EXPO_PUBLIC_API_URL=http://localhost:8001 npx expo start
 *   - Production: EXPO_PUBLIC_API_URL=https://your-api.vercel.app npx expo start
 *   - Fallback:   defaults to http://localhost:8001
 */

import { Platform } from 'react-native';

// ─── Environment URLs ──────────────────────────────────
// Set EXPO_PUBLIC_API_URL in your .env or shell before starting Expo.

const DEV_URL = 'http://192.168.29.123:8001';

// Android emulator needs 10.0.2.2 to reach host localhost
const ANDROID_EMULATOR_URL = 'http://10.0.2.2:8001';

// Physical device LAN URL
const LAN_URL = 'http://192.168.29.123:8001';

// ─── URL Resolution ────────────────────────────────────

import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  // 1. Explicit env var takes highest priority
  const envUrl = (global as any).__EXPO_PUBLIC_API_URL ?? process.env?.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, ''); // strip trailing slashes

  // 2. Auto-detect Expo host IP for physical devices running Expo Go
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).linkingUri;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split('/')[0].split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8001`;
    }
  }

  // 3. Physical phone on LAN or fallback
  return LAN_URL;
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
