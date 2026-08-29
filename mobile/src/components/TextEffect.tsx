import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Text,
  type StyleProp,
  type TextStyle,
} from 'react-native';

interface TextEffectProps {
  children: string;
  style?: StyleProp<TextStyle>;
  delay?: number;
  stagger?: number;
  duration?: number;
  numberOfLines?: number;
  accessibilityLabel?: string;
}

/**
 * Indic-safe animated text effect.
 * Animates text with smooth fade and subtle lift without splitting
 * complex Indic glyphs (Telugu, Hindi, Marathi, etc.) into broken graphemes.
 */
export default function TextEffect({
  children,
  style,
  delay = 0,
  duration = 350,
  numberOfLines,
  accessibilityLabel,
}: TextEffectProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        fadeAnim.setValue(1);
        translateYAnim.setValue(0);
        return;
      }
      fadeAnim.setValue(0);
      translateYAnim.setValue(4);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      cancelled = true;
      fadeAnim.stopAnimation();
      translateYAnim.stopAnimation();
    };
  }, [children, delay, duration, fadeAnim, translateYAnim]);

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      numberOfLines={numberOfLines}
      accessible
      accessibilityLabel={accessibilityLabel ?? children}
    >
      {children}
    </Animated.Text>
  );
}
