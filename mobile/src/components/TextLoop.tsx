import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, type StyleProp, Text, type TextStyle, View } from 'react-native';

interface TextLoopProps {
  children: string[];
  style?: StyleProp<TextStyle>;
  interval?: number;
  duration?: number;
}

/** Accessible native text loop with a subtle cross-fade and vertical transition. */
export default function TextLoop({ children, style, interval = 2800, duration = 260 }: TextLoopProps) {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (children.length < 2) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || reduceMotion) return;
      timer = setInterval(() => {
        Animated.timing(progress, { toValue: 0, duration, useNativeDriver: true }).start(({ finished }) => {
          if (!finished) return;
          setIndex((current) => (current + 1) % children.length);
          progress.setValue(0);
          Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true }).start();
        });
      }, interval);
    });
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      progress.stopAnimation();
    };
  }, [children.length, duration, interval, progress]);

  if (!children.length) return null;
  return (
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={children[index]}>
      <Animated.Text style={[style, {
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
      }]}>
        {children[index]}
      </Animated.Text>
    </View>
  );
}
