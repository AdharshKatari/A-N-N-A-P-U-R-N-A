import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for the Annapurna app.
 * Provides consistent haptic patterns for different interaction types,
 * with safe no-op / navigator.vibrate fallbacks on web browsers.
 */

const vibrate = (ms: number | number[]) => {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
    } catch (_) {}
  }
};

// Light impact - for subtle interactions like tab switches
export const hapticLight = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } else {
    vibrate(10);
  }
};

// Medium impact - for button presses, card taps
export const hapticMedium = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } else {
    vibrate(20);
  }
};

// Heavy impact - for important actions, confirmations
export const hapticHeavy = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  } else {
    vibrate(35);
  }
};

// Selection changed - for picker selections, toggles
export const hapticSelection = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync().catch(() => {});
  } else {
    vibrate(8);
  }
};

// Success notification - for successful operations
export const hapticSuccess = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else {
    vibrate([20, 50, 20]);
  }
};

// Warning notification - for warnings
export const hapticWarning = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } else {
    vibrate([30, 40, 30]);
  }
};

// Error notification - for errors
export const hapticError = () => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  } else {
    vibrate([50, 50, 50]);
  }
};
