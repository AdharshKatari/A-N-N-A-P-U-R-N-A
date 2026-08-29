/**
 * FreshGuard Motion System — Refined Animation Library
 * 
 * Principles:
 * - Less is more: only animate where it communicates state change
 * - Gentle deceleration: custom ease-out curves, no excessive bounce
 * - Consistent timing: 150-250ms (micro), 250-400ms (cards), 400-600ms (modals)
 * - Respect reduced motion: always provide instant fallback
 * - No looping animations, no confetti, no decorative bounce
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
  Pressable,
  StyleSheet,
  View,
  Text,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { hapticLight, hapticMedium } from '../utils/haptics';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// MOTION TOKENS — Single source of truth for timing & easing
// ============================================================================

export const MotionTokens = {
  // Durations (ms)
  duration: {
    micro: 150,      // Button press, toggle
    fast: 200,       // Small UI changes
    standard: 300,   // Card entrance, list items
    moderate: 400,   // Panel transitions
    slow: 500,       // Modal/sheet entrance
    slower: 600,     // Major transitions
  },

  // Easing curves - all decelerate gently
  easing: {
    // Standard ease-out: responsive start, gentle settle
    standard: Easing.bezier(0.25, 0.8, 0.25, 1),
    // Slightly stronger for entrances
    entrance: Easing.bezier(0.2, 0.9, 0.2, 1),
    // For exits - ease-in
    exit: Easing.bezier(0.4, 0, 0.6, 1),
    // Modal/sheet curves
    modal: Easing.bezier(0.32, 0.72, 0, 1),
    // For spring-like feel without actual spring
    gentle: Easing.bezier(0.25, 0.9, 0.3, 0.99),
  },

  // Spring configs (for rare physics-based needs)
  spring: {
    snappy: { tension: 120, friction: 14 },   // Button feedback
    gentle: { tension: 80, friction: 16 },    // Modal entrance
    smooth: { tension: 60, friction: 18 },    // Panel transitions
  },

  // Stagger
  stagger: {
    delay: 50,        // Between items
    maxDelay: 200,    // Cap total stagger time
  },

  // Distances
  distance: {
    micro: 4,
    small: 8,
    standard: 16,
    modal: 40,
  },
} as const;

// ============================================================================
// REDUCED MOTION SUPPORT
// ============================================================================

let _reducedMotion = false;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(_reducedMotion);

  useEffect(() => {
    const check = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      _reducedMotion = enabled;
      setReduced(enabled);
    };
    check();

    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        _reducedMotion = enabled;
        setReduced(enabled);
      }
    );

    return () => listener?.remove?.();
  }, []);

  return reduced;
}

export function getReducedMotion(): boolean {
  return _reducedMotion;
}

// Helper: returns animated config or instant values for reduced motion
export function withReducedMotion<T>(
  reduced: boolean,
  animatedConfig: T,
  instantConfig: T
): T {
  return reduced ? instantConfig : animatedConfig;
}

// ============================================================================
// CORE ANIMATION PRIMITIVES
// ============================================================================

// Fade in with subtle vertical movement
export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  reducedMotion?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = MotionTokens.duration.standard,
  distance = MotionTokens.distance.standard,
  direction = 'up',
  style,
  reducedMotion = false,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translate = useRef(new Animated.Value(reducedMotion ? 0 : distance)).current;

  useEffect(() => {
    if (reducedMotion) return;

    const translateKey = direction === 'left' || direction === 'right' ? 'translateX' : 'translateY';
    const startValue = direction === 'down' || direction === 'right' ? -distance : distance;

    translate.setValue(startValue);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion]);

  const transform = direction === 'left' || direction === 'right'
    ? [{ translateX: translate }]
    : [{ translateY: translate }];

  return (
    <Animated.View style={[{ opacity, transform }, style]}>
      {children}
    </Animated.View>
  );
}

// Scale in from slightly smaller (never from 0)
export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = MotionTokens.duration.moderate,
  initialScale = 0.96,
  style,
  reducedMotion = false,
}: ScaleInProps) {
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : initialScale)).current;
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) return;

    scale.setValue(initialScale);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        easing: MotionTokens.easing.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion]);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Slide up from bottom (for modals, sheets)
export interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function SlideUp({
  children,
  delay = 0,
  duration = MotionTokens.duration.slow,
  distance = MotionTokens.distance.modal,
  style,
  reducedMotion = false,
}: SlideUpProps) {
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : distance)).current;
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) return;

    translateY.setValue(distance);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: MotionTokens.easing.modal,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.7,
        delay,
        easing: MotionTokens.easing.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Simple fade (for crossfades, tab switches)
export interface FadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function Fade({
  children,
  delay = 0,
  duration = MotionTokens.duration.fast,
  style,
  reducedMotion = false,
}: FadeProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: MotionTokens.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}

// ============================================================================
// INTERACTION FEEDBACK
// ============================================================================

export interface PressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  pressScale?: number;
  pressOpacity?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'medium' | 'none';
  reducedMotion?: boolean;
}

export function AnimatedPressable({
  children,
  onPress,
  onPressIn,
  onPressOut,
  pressScale = 0.98,
  pressOpacity = 0.9,
  activeOpacity,
  style,
  haptic = 'light',
  reducedMotion = false,
  disabled = false,
}: PressableProps & { activeOpacity?: number; disabled?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const triggerHaptic = useCallback(() => {
    if (haptic === 'light') hapticLight();
    else if (haptic === 'medium') hapticMedium();
  }, [haptic]);

  const handlePressIn = useCallback(() => {
    triggerHaptic();
    if (reducedMotion) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: pressScale,
        duration: MotionTokens.duration.micro,
        easing: MotionTokens.easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressOpacity,
        duration: MotionTokens.duration.micro,
        useNativeDriver: true,
      }),
    ]).start();
    onPressIn?.();
  }, [pressScale, pressOpacity, reducedMotion, onPressIn, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (reducedMotion) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: MotionTokens.duration.fast,
        easing: MotionTokens.easing.standard,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: MotionTokens.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
    onPressOut?.();
  }, [onPressOut, reducedMotion]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// LOADING STATES
// ============================================================================

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  // No shimmer animation - static skeleton is calmer
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.dividerLight,
        },
        style,
      ]}
    />
  );
}

export interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[{ gap: 8 }, style]}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={{ gap: 6 }}>
        <Skeleton width="60%" height={14} borderRadius={4} />
        <Skeleton width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

// ============================================================================
// PROGRESSIVE DISCLOSURE — Expand/Collapse
// ============================================================================

export interface ExpandProps {
  children: React.ReactNode;
  isExpanded: boolean;
  duration?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function Expand({
  children,
  isExpanded,
  duration = MotionTokens.duration.moderate,
  style,
  reducedMotion = false,
}: ExpandProps) {
  const height = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      height.setValue(isExpanded ? 1 : 0);
      opacity.setValue(isExpanded ? 1 : 0);
      return;
    }

    Animated.parallel([
      Animated.timing(height, {
        toValue: isExpanded ? 1 : 0,
        duration,
        easing: MotionTokens.easing.standard,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: isExpanded ? 1 : 0,
        duration: duration * 0.5,
        easing: MotionTokens.easing.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, reducedMotion]);

  return (
    <Animated.View
      style={[
        { opacity, maxHeight: height.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }), overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Rotate chevron for expand triggers
export interface ChevronProps {
  isExpanded: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function Chevron({
  isExpanded,
  size = 20,
  color = Colors.textMuted,
  style,
  reducedMotion = false,
}: ChevronProps) {
  const rotate = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      rotate.setValue(isExpanded ? 1 : 0);
      return;
    }
    Animated.timing(rotate, {
      toValue: isExpanded ? 1 : 0,
      duration: MotionTokens.duration.fast,
      easing: MotionTokens.easing.standard,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, reducedMotion]);

  return (
    <Animated.View
      style={[
        { transform: [{ rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] },
        style,
      ]}
    >
      <Text style={{ fontSize: size, color }}>▼</Text>
    </Animated.View>
  );
}

// ============================================================================
// STATUS CHANGE FEEDBACK
// ============================================================================

export interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
  size?: number;
  style?: ViewStyle;
}

export function StatusIndicator({
  status,
  size = 24,
  style,
}: StatusIndicatorProps) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      setAnimKey(k => k + 1);
    }
  }, [status]);

  if (status === 'idle') return null;

  const colors = {
    loading: Colors.primaryDark,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
  };

  const iconNames = {
    loading: 'sync',
    success: 'check-circle',
    error: 'error',
    warning: 'warning',
  };

  // Simple spin for loading, scale-in for others
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'loading') {
      spin.setValue(0);
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scale.setValue(0);
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }).start();
    }
  }, [status, animKey]);

  if (status === 'loading') {
    return (
      <Animated.View
        key={animKey}
        style={[
          { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
          style,
        ]}
      >
        <Text style={{ fontSize: size, color: colors.loading }}>⟳</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key={animKey}
      style={[{ transform: [{ scale }] }, style]}
    >
      <Text style={{ fontSize: size, color: colors[status] }}>
        {status === 'success' ? '✓' : status === 'error' ? '✕' : '⚠'}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// PAGE TRANSITION WRAPPER (for use with navigation)
// ============================================================================

export interface PageTransitionProps {
  children: React.ReactNode;
  entering?: boolean;
  exiting?: boolean;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function PageTransition({
  children,
  entering = true,
  exiting = false,
  style,
  reducedMotion = false,
}: PageTransitionProps) {
  const opacity = useRef(new Animated.Value(entering ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(entering ? 16 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    if (entering) {
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: MotionTokens.duration.standard,
          easing: MotionTokens.easing.entrance,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: MotionTokens.duration.standard,
          easing: MotionTokens.easing.entrance,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (exiting) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: MotionTokens.duration.fast,
          easing: MotionTokens.easing.exit,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: MotionTokens.duration.fast,
          easing: MotionTokens.easing.exit,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [entering, exiting, reducedMotion]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// STAGGER HELPER — For lists of related items
// ============================================================================

export function createStaggeredAnimations(
  count: number,
  baseDelay: number = 0,
  staggerDelay: number = MotionTokens.stagger.delay
): Array<{ delay: number; duration: number }> {
  return Array.from({ length: count }, (_, i) => ({
    delay: baseDelay + Math.min(i * staggerDelay, MotionTokens.stagger.maxDelay),
    duration: MotionTokens.duration.standard,
  }));
}

// ============================================================================
// FadeInUp — Card/element fades in and slides up on mount
// ============================================================================

export interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function FadeInUp({
  children,
  delay = 0,
  duration = MotionTokens.duration.standard,
  distance = MotionTokens.distance.standard,
  style,
  reducedMotion = false,
}: FadeInUpProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : distance)).current;

  useEffect(() => {
    if (reducedMotion) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: MotionTokens.easing.entrance,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reducedMotion]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// ProgressFill — Animated progress bar
// ============================================================================

export interface ProgressFillProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function ProgressFill({
  progress,
  height = 8,
  color = Colors.primaryDark,
  backgroundColor = '#E0E0E0',
  showLabel = false,
  style,
}: ProgressFillProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: progress / 100,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressContainer, style]}>
      <View style={[styles.progressTrack, { height, backgroundColor, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
}

// ============================================================================
// EXPORTS — Clean public API
// ============================================================================

export const Motion = {
  tokens: MotionTokens,
  useReducedMotion,
  FadeIn,
  FadeInUp,
  ScaleIn,
  SlideUp,
  Fade,
  AnimatedPressable,
  Skeleton,
  SkeletonCard,
  Expand,
  Chevron,
  StatusIndicator,
  ProgressFill,
  PageTransition,
  createStaggeredAnimations,
} as const;

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Progress styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {},
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
    textAlign: 'right',
  },
});
