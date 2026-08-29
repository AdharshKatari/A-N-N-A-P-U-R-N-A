/**
 * Annapurna Animation Library — Premium Edition
 *
 * Complete collection of animation utilities for the farming app.
 * Uses custom easing curves, spring physics, and reduced-motion support.
 * Inspired by Emil Kowalski's design engineering philosophy.
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
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { hapticLight, hapticMedium, hapticHeavy } from '../utils/haptics';
import { Colors } from '../constants/theme';
export { MotionTokens } from './MotionSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// PREMIUM EASING CURVES — Stronger than CSS defaults
// ============================================================================
const easing = {
  /** Strong ease-out for UI interactions — starts fast, feels responsive */
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  /** Strong ease-in-out for on-screen movement */
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** iOS-like drawer curve */
  easeDrawer: Easing.bezier(0.32, 0.72, 0, 1),
};

// ============================================================================
// PREMIUM SPRING CONFIGS — Apple-style physics
// ============================================================================
const SPRING = {
  /** Snappy UI interactions — buttons, toggles */
  snappy: { tension: 120, friction: 10 },
  /** Gentle entrances — cards, modals */
  gentle: { tension: 80, friction: 12 },
  /** Playful bounce — celebrations, delight moments */
  bouncy: { tension: 100, friction: 8 },
  /** Smooth transitions — page changes */
  smooth: { tension: 60, friction: 12 },
} as const;

// ============================================================================
// SECTION 1: ENTRANCE/EXIT ANIMATIONS
// ============================================================================

// ---------------------------------------------------------------------------
// FadeInUp — Card/element fades in and slides up on mount
// ---------------------------------------------------------------------------

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 350,
  distance = 16,
  style,
}: FadeInUpProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FadeInDown — Element fades in and slides down
// ---------------------------------------------------------------------------

interface FadeInDownProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function FadeInDown({
  children,
  delay = 0,
  duration = 350,
  distance = 16,
  style,
}: FadeInDownProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FadeInLeft — Element fades in from left
// ---------------------------------------------------------------------------

interface FadeInLeftProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function FadeInLeft({
  children,
  delay = 0,
  duration = 350,
  distance = 24,
  style,
}: FadeInLeftProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FadeInRight — Element fades in from right (already exists, enhanced)
// ---------------------------------------------------------------------------

interface FadeInRightProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function FadeInRight({
  children,
  delay = 0,
  duration = 350,
  distance = 24,
  style,
}: FadeInRightProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// FadeIn — Simple fade in on mount (enhanced)
// ---------------------------------------------------------------------------

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  direction?: string;
  reducedMotion?: boolean;
}

export function FadeIn({ children, delay = 0, duration = 300, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: easing.easeOut,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// BounceIn — Bouncy entrance animation
// ---------------------------------------------------------------------------

interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function BounceIn({
  children,
  delay = 0,
  duration = 600,
  style,
}: BounceInProps) {
  // Never animate from scale(0) — nothing in the real world disappears completely
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        ...SPRING.bouncy,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.3,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// SlideInBottom — Slides up from bottom (for modals)
// ---------------------------------------------------------------------------

interface SlideInBottomProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle;
}

export function SlideInBottom({
  children,
  delay = 0,
  duration = 350,
  distance = 80,
  style,
}: SlideInBottomProps) {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: easing.easeDrawer,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ZoomIn — Zoom from center
// ---------------------------------------------------------------------------

interface ZoomInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  style?: ViewStyle;
}

export function ZoomIn({
  children,
  delay = 0,
  duration = 400,
  initialScale = 0.92,
  style,
}: ZoomInProps) {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        ...SPRING.gentle,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.5,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ScaleIn — Scales up from small (enhanced)
// ---------------------------------------------------------------------------

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  reducedMotion?: boolean;
}

export function ScaleIn({ children, delay = 0, duration = 400, style }: ScaleInProps) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        ...SPRING.gentle,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// SECTION 2: LOADING/STATUS ANIMATIONS
// ============================================================================

// ---------------------------------------------------------------------------
// Skeleton/Shimmer — Loading placeholder with shimmer effect
// ---------------------------------------------------------------------------

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — Complete skeleton card layout
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.skeletonCard, style]}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.skeletonCardContent}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Spin — Continuous rotation
// ---------------------------------------------------------------------------

interface SpinProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export function Spin({
  children,
  duration = 1000,
  style,
}: SpinProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[{ transform: [{ rotate: spin }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Wave — Wave motion (for audio indicators, weather)
// ---------------------------------------------------------------------------

interface WaveProps {
  barCount?: number;
  barWidth?: number;
  barHeight?: number;
  color?: string;
  style?: ViewStyle;
}

export function Wave({
  barCount = 5,
  barWidth = 4,
  barHeight = 30,
  color = Colors.primaryDark,
  style,
}: WaveProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const animationArray = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            delay: index * 100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      )
    );

    const compositeAnimation = Animated.parallel(animationArray);
    compositeAnimation.start();
    return () => compositeAnimation.stop();
  }, []);

  return (
    <View style={[styles.waveContainer, style]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              width: barWidth,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [barHeight * 0.3, barHeight],
              }),
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Glow — Pulsing glow effect
// ---------------------------------------------------------------------------

interface GlowProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
}

export function Glow({
  children,
  color = Colors.primaryDark,
  intensity = 10,
  duration = 1500,
  style,
}: GlowProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const glowStyle = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, intensity],
  });

  return (
    <Animated.View
      style={[
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowAnim,
          shadowRadius: glowStyle,
          elevation: glowStyle,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator — Bouncing dots for chat/AI responses
// ---------------------------------------------------------------------------

interface TypingIndicatorProps {
  dotCount?: number;
  dotSize?: number;
  color?: string;
  style?: ViewStyle;
}

export function TypingIndicator({
  dotCount = 3,
  dotSize = 8,
  color = Colors.primaryDark,
  style,
}: TypingIndicatorProps) {
  const animations = useRef(
    Array.from({ length: dotCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animationArray = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: -10,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      )
    );

    const compositeAnimation = Animated.parallel(animationArray);
    compositeAnimation.start();
    return () => compositeAnimation.stop();
  }, []);

  return (
    <View style={[styles.typingContainer, style]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: color,
              transform: [{ translateY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pulse — Subtle repeating pulse animation (enhanced)
// ---------------------------------------------------------------------------

interface PulseProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  duration?: number;
  style?: ViewStyle;
}

export function Pulse({
  children,
  minScale = 0.95,
  maxScale = 1.05,
  duration = 1500,
  style,
}: PulseProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// SECTION 3: INTERACTION ANIMATIONS
// ============================================================================

// ---------------------------------------------------------------------------
// AnimatedPressable — Press feedback with scale + opacity + haptic (enhanced)
// ---------------------------------------------------------------------------

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  pressScale?: number;
  pressOpacity?: number;
  style?: StyleProp<ViewStyle>;
  enableHaptics?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

export function AnimatedPressable({
  children,
  onPress,
  pressScale = 0.97,
  pressOpacity = 0.85,
  style,
  enableHaptics = true,
  hapticIntensity = 'medium',
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const triggerHaptic = () => {
    if (!enableHaptics) return;
    switch (hapticIntensity) {
      case 'light':
        hapticLight();
        break;
      case 'medium':
        hapticMedium();
        break;
      case 'heavy':
        hapticHeavy();
        break;
    }
  };

  const handlePressIn = () => {
    triggerHaptic();
    Animated.parallel([
      Animated.timing(scale, {
        toValue: pressScale,
        duration: 100,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...SPRING.snappy,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Spring — Physics-based bounce animation
// ---------------------------------------------------------------------------

interface SpringProps {
  children: React.ReactNode;
  onPress?: () => void;
  tension?: number;
  friction?: number;
  style?: ViewStyle;
}

export function Spring({
  children,
  onPress,
  tension = 100,
  friction = 5,
  style,
}: SpringProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    hapticMedium();
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        tension,
        friction,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension,
        friction,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// RubberBand — Overscroll bounce effect
// ---------------------------------------------------------------------------

interface RubberBandProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function RubberBand({
  children,
  onPress,
  style,
}: RubberBandProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    hapticLight();
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 200,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.05,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Flip — 3D card flip animation
// ---------------------------------------------------------------------------

interface FlipProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipped?: boolean;
  style?: ViewStyle;
}

export function Flip({
  frontContent,
  backContent,
  isFlipped = false,
  style,
}: FlipProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 90, 180],
    outputRange: [0, 0, 1],
  });

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={[styles.flipContainer, style]}>
      <Animated.View
        style={[
          styles.flipCard,
          {
            opacity: frontOpacity,
            transform: [{ rotateY: frontRotate }],
          },
        ]}
      >
        {frontContent}
      </Animated.View>
      <Animated.View
        style={[
          styles.flipCard,
          styles.flipCardBack,
          {
            opacity: backOpacity,
            transform: [{ rotateY: backRotate }],
          },
        ]}
      >
        {backContent}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rotate — Rotation on interaction
// ---------------------------------------------------------------------------

interface RotateProps {
  children: React.ReactNode;
  onPress?: () => void;
  rotation?: number;
  style?: ViewStyle;
}

export function Rotate({
  children,
  onPress,
  rotation = 90,
  style,
}: RotateProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isRotated, setIsRotated] = useState(false);

  const handlePress = () => {
    hapticLight();
    setIsRotated(!isRotated);
    Animated.spring(rotateAnim, {
      toValue: isRotated ? 0 : 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
    onPress?.();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotation}deg`],
  });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[{ transform: [{ rotate }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Shake — Horizontal shake for error states
// ---------------------------------------------------------------------------

interface ShakeProps {
  children: React.ReactNode;
  isShaking?: boolean;
  style?: ViewStyle;
}

export function Shake({
  children,
  isShaking = false,
  style,
}: ShakeProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isShaking) {
      hapticHeavy();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [isShaking]);

  return (
    <Animated.View style={[{ transform: [{ translateX: shakeAnim }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Wobble — Gentle wobble for attention grabber
// ---------------------------------------------------------------------------

interface WobbleProps {
  children: React.ReactNode;
  isWobbling?: boolean;
  style?: ViewStyle;
}

export function Wobble({
  children,
  isWobbling = false,
  style,
}: WobbleProps) {
  const wobbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWobbling) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(wobbleAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(wobbleAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
          Animated.timing(wobbleAnim, { toValue: 3, duration: 100, useNativeDriver: true }),
          Animated.timing(wobbleAnim, { toValue: -3, duration: 100, useNativeDriver: true }),
          Animated.timing(wobbleAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isWobbling]);

  return (
    <Animated.View style={[{ transform: [{ rotate: wobbleAnim.interpolate({
      inputRange: [-5, 5],
      outputRange: ['-5deg', '5deg'],
    }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// SECTION 4: SCROLL/PARALLAX ANIMATIONS
// ============================================================================

// ---------------------------------------------------------------------------
// ParallaxScroll — Background moves slower than foreground
// ---------------------------------------------------------------------------

interface ParallaxScrollProps {
  children: React.ReactNode;
  headerImage?: React.ReactNode;
  headerHeight?: number;
  style?: ViewStyle;
}

export function ParallaxScroll({
  children,
  headerImage,
  headerHeight = 300,
  style,
}: ParallaxScrollProps) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslate = scrollY.interpolate({
    inputRange: [-headerHeight, 0, headerHeight],
    outputRange: [-headerHeight / 2, 0, headerHeight * 0.3],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [-headerHeight, 0, headerHeight / 2],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.parallaxContainer, style]}>
      <Animated.View
        style={[
          styles.parallaxHeader,
          {
            height: headerHeight,
            transform: [{ translateY: headerTranslate }],
            opacity: headerOpacity,
          },
        ]}
      >
        {headerImage}
      </Animated.View>
      <Animated.ScrollView
        contentContainerStyle={[styles.parallaxContent, { paddingTop: headerHeight }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StickyHeader — Header sticks on scroll
// ---------------------------------------------------------------------------

interface StickyHeaderProps {
  children: React.ReactNode;
  header: React.ReactNode;
  headerHeight?: number;
  style?: ViewStyle;
}

export function StickyHeader({
  children,
  header,
  headerHeight = 60,
  style,
}: StickyHeaderProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isSticky, setIsSticky] = useState(false);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsSticky(offsetY > headerHeight);
  }, [headerHeight]);

  return (
    <View style={[styles.stickyContainer, style]}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            height: headerHeight,
            transform: [{ translateY: headerTranslate }],
          },
        ]}
      >
        {header}
      </Animated.View>
      {isSticky && (
        <View style={[styles.stickyHeaderFixed, { height: headerHeight }]}>
          {header}
        </View>
      )}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: headerHeight }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FadeOnScroll — Elements fade based on scroll position
// ---------------------------------------------------------------------------

interface FadeOnScrollProps {
  children: React.ReactNode;
  fadeThreshold?: number;
  style?: ViewStyle;
}

export function FadeOnScroll({
  children,
  fadeThreshold = 100,
  style,
}: FadeOnScrollProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const opacity = scrollY.interpolate({
    inputRange: [0, fadeThreshold],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.fadeOnScrollContainer, style]}>
      <Animated.View style={[styles.fadeOnScrollContent, { opacity }]}>
        {children}
      </Animated.View>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        style={styles.fadeOnScrollView}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScaleOnScroll — Cards scale on scroll
// ---------------------------------------------------------------------------

interface ScaleOnScrollProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  style?: ViewStyle;
}

export function ScaleOnScroll({
  children,
  minScale = 0.9,
  maxScale = 1,
  style,
}: ScaleOnScrollProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [maxScale, minScale],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.scaleOnScrollContainer, style]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        style={styles.scaleOnScrollView}
      />
    </View>
  );
}

// ============================================================================
// SECTION 5: TRANSITION ANIMATIONS
// ============================================================================

// ---------------------------------------------------------------------------
// SharedElement — Element moves between screens (simplified)
// ---------------------------------------------------------------------------

interface SharedElementProps {
  children: React.ReactNode;
  tag: string;
  style?: ViewStyle;
}

export function SharedElement({
  children,
  tag,
  style,
}: SharedElementProps) {
  // Simplified shared element - in production, use react-native-shared-element
  return (
    <View style={[styles.sharedElementContainer, style]} testID={`shared-element-${tag}`}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// HeroAnimation — Smooth screen transition
// ---------------------------------------------------------------------------

interface HeroAnimationProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function HeroAnimation({
  children,
  onPress,
  style,
}: HeroAnimationProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.95,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Morph — Shape transforms (icon to button, etc.)
// ---------------------------------------------------------------------------

interface MorphProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  expandedWidth?: number;
  expandedHeight?: number;
  collapsedWidth?: number;
  collapsedHeight?: number;
  style?: ViewStyle;
}

export function Morph({
  children,
  isExpanded = false,
  expandedWidth = 200,
  expandedHeight = 50,
  collapsedWidth = 50,
  collapsedHeight = 50,
  style,
}: MorphProps) {
  const widthAnim = useRef(new Animated.Value(collapsedWidth)).current;
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const borderRadiusAnim = useRef(new Animated.Value(collapsedHeight / 2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: isExpanded ? expandedWidth : collapsedWidth,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }),
      Animated.spring(heightAnim, {
        toValue: isExpanded ? expandedHeight : collapsedHeight,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }),
      Animated.spring(borderRadiusAnim, {
        toValue: isExpanded ? 12 : collapsedHeight / 2,
        tension: 80,
        friction: 12,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  return (
    <Animated.View
      style={[
        {
          width: widthAnim,
          height: heightAnim,
          borderRadius: borderRadiusAnim,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ExpandCollapse — Accordion animation
// ---------------------------------------------------------------------------

interface ExpandCollapseProps {
  header: React.ReactNode;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  style?: any;
}

export function ExpandCollapse({
  header,
  children,
  isExpanded = false,
  onToggle,
  style,
}: ExpandCollapseProps) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        ...SPRING.gentle,
        useNativeDriver: false,
      }),
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        ...SPRING.snappy,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300], // Adjust based on content
  });

  return (
    <View style={[styles.expandCollapseContainer, style]}>
      <Pressable onPress={onToggle}>
        <View style={styles.expandCollapseHeader}>
          {header}
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Text style={styles.expandCollapseArrow}>▼</Text>
          </Animated.View>
        </View>
      </Pressable>
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <View style={styles.expandCollapseContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Crossfade — Fade between content (for tab switching)
// ---------------------------------------------------------------------------

interface CrossfadeProps {
  children: React.ReactNode[];
  activeIndex: number;
  style?: ViewStyle;
}

export function Crossfade({
  children,
  activeIndex,
  style,
}: CrossfadeProps) {
  return (
    <View style={[styles.crossfadeContainer, style]}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index === activeIndex ? 0 : 100}>
          <View style={{ opacity: index === activeIndex ? 1 : 0 }}>
            {child}
          </View>
        </FadeIn>
      ))}
    </View>
  );
}

// ============================================================================
// SECTION 6: MICRO-INTERACTIONS
// ============================================================================

// ---------------------------------------------------------------------------
// Ripple — Touch ripple effect
// ---------------------------------------------------------------------------

interface RippleProps {
  children: React.ReactNode;
  onPress?: () => void;
  rippleColor?: string;
  style?: ViewStyle;
}

export function Ripple({
  children,
  onPress,
  rippleColor = 'rgba(20, 92, 46, 0.2)',
  style,
}: RippleProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    hapticLight();
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleAnim.setValue(0);
    });
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.rippleContainer, style]}>
        {children}
        <Animated.View
          style={[
            styles.ripple,
            {
              backgroundColor: rippleColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Checkmark — Animated checkmark for success states
// ---------------------------------------------------------------------------

interface CheckmarkProps {
  size?: number;
  color?: string;
  isVisible?: boolean;
  style?: ViewStyle;
}

export function Checkmark({
  size = 24,
  color = Colors.primaryDark,
  isVisible = true,
  style,
}: CheckmarkProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      hapticSuccess();
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Bounce effect
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 200,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [isVisible]);

  return (
    <Animated.View
      style={[
        styles.checkmarkContainer,
        {
          width: size,
          height: size,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Text style={[styles.checkmarkText, { color, fontSize: size * 0.8 }]}>✓</Text>
    </Animated.View>
  );
}

// Helper function for success haptic
const hapticSuccess = () => {
  // Using medium as fallback for success
  hapticMedium();
};

// ---------------------------------------------------------------------------
// ProgressFill — Animated progress bar
// ---------------------------------------------------------------------------

interface ProgressFillProps {
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

// ---------------------------------------------------------------------------
// Confetti — Celebration particles
// ---------------------------------------------------------------------------

interface ConfettiProps {
  isActive?: boolean;
  particleCount?: number;
  colors?: string[];
  style?: ViewStyle;
}

export function Confetti({
  isActive = false,
  particleCount = 50,
  colors = ['#145C2E', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  style,
}: ConfettiProps) {
  const particles = useRef(
    Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  ).current;

  useEffect(() => {
    if (isActive) {
      hapticSuccess();
      const animations = particles.map((particle, index) => {
        const startX = Math.random() * SCREEN_WIDTH;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = SCREEN_HEIGHT + 100;

        particle.x.setValue(startX);
        particle.y.setValue(-50);
        particle.opacity.setValue(1);

        return Animated.parallel([
          Animated.timing(particle.y, {
            toValue: endY,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: endX,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1500 + Math.random() * 500),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start();
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <View style={[styles.confettiContainer, style]}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiParticle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================================
// SECTION 7: COMPOSITE COMPONENTS
// ============================================================================

// ---------------------------------------------------------------------------
// RefreshAnimation — Custom animated pull-to-refresh indicator
// ---------------------------------------------------------------------------

interface RefreshAnimationProps {
  refreshing: boolean;
  pullProgress?: number;
  style?: ViewStyle;
}

export function RefreshAnimation({ refreshing, pullProgress = 0, style }: RefreshAnimationProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (refreshing) {
      const spinAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      pulseAnimation.start();
      opacity.setValue(1);

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      rotation.setValue(0);
      scale.setValue(1);
      opacity.setValue(0.6);
    }
  }, [refreshing]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.refreshContainer, style]}>
      <Animated.View
        style={[
          styles.refreshIcon,
          {
            transform: [{ rotate: spin }, { scale }],
            opacity,
          },
        ]}
      >
        <Text style={styles.refreshIconText}>↻</Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// HapticButton — Button with built-in haptic feedback
// ---------------------------------------------------------------------------

interface HapticButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';
}

export function HapticButton({
  children,
  onPress,
  style,
  hapticType = 'medium',
}: HapticButtonProps) {
  const triggerHaptic = () => {
    switch (hapticType) {
      case 'light':
        hapticLight();
        break;
      case 'medium':
        hapticMedium();
        break;
      case 'heavy':
        hapticHeavy();
        break;
      case 'selection':
      case 'success':
      case 'warning':
      case 'error':
        hapticMedium();
        break;
    }
  };

  return (
    <Pressable
      onPress={() => {
        triggerHaptic();
        onPress?.();
      }}
      style={style}
    >
      {children}
    </Pressable>
  );
}

// CountUp — Animated number counter (enhanced)

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  style?: any;
}

export function CountUp({
  to,
  duration = 1200,
  delay = 0,
  format = (n) => String(n),
  style,
}: CountUpProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(format(0));

  useEffect(() => {
    animatedValue.addListener(({ value }) => {
      setDisplayValue(format(Math.round(value)));
    });

    Animated.timing(animatedValue, {
      toValue: to,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeAllListeners();
  }, [to]);

  return <Animated.Text style={style}>{displayValue}</Animated.Text>;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Skeleton styles
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  skeletonCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  // Wave styles
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
  },
  waveBar: {
    borderRadius: 2,
  },
  // Typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  typingDot: {},
  // Flip styles
  flipContainer: {
    position: 'relative',
  },
  flipCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  flipCardBack: {
    backfaceVisibility: 'hidden',
  },
  // Parallax styles
  parallaxContainer: {
    flex: 1,
  },
  parallaxHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  parallaxContent: {
    flexGrow: 1,
  },
  // Sticky header styles
  stickyContainer: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stickyHeaderFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Fade on scroll styles
  fadeOnScrollContainer: {
    flex: 1,
  },
  fadeOnScrollContent: {
    flex: 1,
  },
  fadeOnScrollView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Scale on scroll styles
  scaleOnScrollContainer: {
    flex: 1,
  },
  scaleOnScrollView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Shared element styles
  sharedElementContainer: {},
  // Expand/collapse styles
  expandCollapseContainer: {
    overflow: 'hidden',
  },
  expandCollapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  expandCollapseArrow: {
    fontSize: 12,
    color: '#666',
  },
  expandCollapseContent: {
    padding: 16,
    paddingTop: 0,
  },
  // Crossfade styles
  crossfadeContainer: {
    flex: 1,
  },
  // Ripple styles
  rippleContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
  },
  // Checkmark styles
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontWeight: 'bold',
  },
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
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  // Refresh styles
  refreshContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  refreshIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconText: {
    fontSize: 20,
    color: Colors.primaryDark,
  },
});
