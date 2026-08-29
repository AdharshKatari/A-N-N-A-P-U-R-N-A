import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for the Annapurna app.
 * Provides consistent haptic patterns for different interaction types.
 */

// Light impact - for subtle interactions like tab switches
export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// Medium impact - for button presses, card taps
export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// Heavy impact - for important actions, confirmations
export const hapticHeavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

// Selection changed - for picker selections, toggles
export const hapticSelection = () => {
  Haptics.selectionAsync();
};

// Success notification - for successful operations
export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// Warning notification - for warnings
export const hapticWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

// Error notification - for errors
export const hapticError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
