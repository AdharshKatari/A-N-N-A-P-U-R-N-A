import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, type StyleProp, type TextStyle } from 'react-native';
import { Colors, FontFamily } from '../constants/theme';

interface TextShimmerProps {
  children: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

/** Lightweight native shimmer for short, indeterminate progress labels. */
export default function TextShimmer({ children, style, duration = 1000 }: TextShimmerProps) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || reduceMotion) {
        progress.setValue(1);
        return;
      }
      animation = Animated.loop(Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0, duration, useNativeDriver: false }),
      ]));
      animation.start();
    });
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [duration, progress]);
  return (
    <Animated.Text accessibilityRole="text" accessibilityLiveRegion="polite" style={[{
      fontFamily: FontFamily.medium,
      color: progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [Colors.textMuted, Colors.primaryDeep, Colors.primaryLight],
      }),
      opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.62, 1, 0.76] }),
    }, style]}>
      {children}
    </Animated.Text>
  );
}
