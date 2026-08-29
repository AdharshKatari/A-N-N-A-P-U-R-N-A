import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { FontFamily } from '../constants/theme';

interface SlidingNumberProps {
  value: number;
  padStart?: boolean;
  style?: StyleProp<TextStyle>;
}

export default function SlidingNumber({ value, padStart = false, style }: SlidingNumberProps) {
  const [display, setDisplay] = useState(value);
  const motion = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (value === display) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        setDisplay(value);
        return;
      }
      Animated.timing(motion, { toValue: 0, duration: 110, useNativeDriver: true }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setDisplay(value);
        motion.setValue(0);
        Animated.timing(motion, { toValue: 1, duration: 170, useNativeDriver: true }).start();
      });
    });
    return () => {
      cancelled = true;
      motion.stopAnimation();
    };
  }, [display, motion, value]);
  return (
    <Animated.Text style={[styles.number, style, {
      opacity: motion,
      transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
    }]}>
      {padStart ? String(display).padStart(2, '0') : display}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  number: { fontFamily: FontFamily.medium, fontVariant: ['tabular-nums'] },
});
