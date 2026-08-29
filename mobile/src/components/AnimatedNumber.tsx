import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, type StyleProp, type TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  useGrouping?: boolean;
}

export default function AnimatedNumber({
  value, style, duration = 1100, decimals = 0, prefix = '', suffix = '', useGrouping = true,
}: AnimatedNumberProps) {
  const animated = useRef(new Animated.Value(0)).current;
  const previous = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const listener = animated.addListener(({ value: next }) => setDisplay(next));
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        animated.setValue(value);
        previous.current = value;
        return;
      }
      animated.setValue(previous.current);
      animation = Animated.timing(animated, { toValue: value, duration, useNativeDriver: false });
      animation.start(({ finished }) => {
        if (finished) previous.current = value;
      });
    });
    return () => {
      animation?.stop();
      animated.removeListener(listener);
    };
  }, [animated, duration, value]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  });
  return (
    <Animated.Text accessibilityLabel={`${prefix}${value}${suffix}`} style={style}>
      {prefix}{formatted}{suffix}
    </Animated.Text>
  );
}
