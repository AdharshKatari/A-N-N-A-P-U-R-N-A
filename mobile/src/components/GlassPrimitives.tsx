import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from 'react-native';
import { Colors, BorderRadius, Shadows } from '../constants/theme';
import { hapticHeavy, hapticLight, hapticMedium } from '../utils/haptics';

export const GlassMotion = {
  duration: { instant: 0, fast: 180, standard: 300, moderate: 350, slow: 400 },
  stagger: { tight: 40, normal: 70, relaxed: 100, delay: 70 },
} as const;

export const MotionTokens = GlassMotion;

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);
  return reduced;
}

type ContainerProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  disabled?: boolean;
  level?: string;
  padding?: 'sm' | 'md' | 'lg';
  borderRadius?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  variant?: string;
  size?: string;
};

function runHaptic(kind: ContainerProps['haptic']) {
  if (kind === 'medium') hapticMedium();
  else if (kind === 'heavy') hapticHeavy();
  else if (kind === 'light') hapticLight();
}

export function GlassCard({ children, style, onPress, disabled, testID, accessibilityLabel, haptic = 'light' }: ContainerProps) {
  if (!onPress) return <View testID={testID} style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} testID={testID}
      disabled={disabled} onPress={() => { runHaptic(haptic); onPress(); }}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function GlassPanel({ children, style, testID }: ContainerProps) {
  return <View testID={testID} style={[styles.panel, style]}>{children}</View>;
}

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  activeOpacity?: number;
};

export const GlassButton = React.forwardRef<View, ButtonProps>(function GlassButton(
  { children, style, variant = 'primary', size = 'md', fullWidth, loading, haptic = 'light', disabled, onPress, ...props }, ref,
) {
  return (
    <Pressable ref={ref} accessibilityRole="button" disabled={disabled || loading}
      onPress={(event) => { runHaptic(haptic); onPress?.(event); }} {...props}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        fullWidth && styles.fullWidth,
        style,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? '#fff' : Colors.primaryDeep} /> : children}
    </Pressable>
  );
});

export const AnimatedPressable = GlassButton;

export function GlassBadge({ children, style }: ContainerProps) {
  return <View style={[styles.badge, style]}>{children}</View>;
}

export function GlassChip({ children, style, onPress, disabled, haptic = 'light' }: ContainerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        runHaptic(haptic);
        onPress?.();
      }}
      style={({ pressed }) => [styles.chip, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

export function GlassProgress({ progress = 0, style }: { progress?: number; style?: StyleProp<ViewStyle>; [key: string]: unknown }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  return <View style={[styles.progress, style]}><View style={[styles.progressFill, { width: `${safeProgress}%` }]} /></View>;
}

export function GlassSkeleton({ width = '100%', height = 16, style }: { width?: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle> }) {
  return <View accessibilityLabel="Loading" style={[styles.skeleton, { width, height }, style]} />;
}

export function GlassSkeletonCard({ style }: { style?: StyleProp<ViewStyle>; [key: string]: unknown }) {
  return <View accessibilityLabel="Loading" style={[styles.skeletonCard, style]} />;
}

type MotionProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  reducedMotion?: boolean;
  direction?: string;
};

function MotionView({ children, style, delay = 0, duration = 300, reducedMotion }: MotionProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, delay: reducedMotion ? 0 : delay, duration: reducedMotion ? 0 : duration, useNativeDriver: true }).start();
  }, [delay, duration, opacity, reducedMotion]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

export const FadeIn = MotionView;
export const ScaleIn = MotionView;

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.82)', borderColor: Colors.borderGlass, borderWidth: 1, borderRadius: BorderRadius.lg, ...Shadows.card },
  panel: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: Colors.borderGlass, borderWidth: 1, borderRadius: BorderRadius.xl },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  button_sm: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.sm },
  button_md: { minHeight: 46, paddingHorizontal: 20, paddingVertical: 11, borderRadius: BorderRadius.md },
  button_lg: { minHeight: 54, paddingHorizontal: 26, paddingVertical: 15, borderRadius: BorderRadius.lg },
  button_primary: { backgroundColor: Colors.primaryDeep },
  button_secondary: { backgroundColor: Colors.primarySoft },
  button_outline: { backgroundColor: 'transparent', borderColor: Colors.primary, borderWidth: 1.5 },
  button_ghost: { backgroundColor: 'transparent' },
  button_destructive: { backgroundColor: Colors.error },
  fullWidth: { width: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.surfaceAlt,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  progress: { height: 8, overflow: 'hidden', borderRadius: BorderRadius.full, backgroundColor: Colors.divider },
  progressFill: { height: '100%', borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  skeleton: { borderRadius: BorderRadius.sm, backgroundColor: Colors.dividerLight },
  skeletonCard: { height: 120, borderRadius: BorderRadius.lg, backgroundColor: Colors.dividerLight, marginBottom: 12 },
});
