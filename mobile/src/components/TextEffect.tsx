import React, { useEffect, useMemo, useRef } from 'react';
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

/** Native equivalent of a per-character fade text effect. */
export default function TextEffect({
  children,
  style,
  delay = 0,
  stagger = 22,
  duration = 280,
  numberOfLines,
  accessibilityLabel,
}: TextEffectProps) {
  const characters = useMemo(() => Array.from(children), [children]);
  const values = useRef<Animated.Value[]>([]);
  if (values.current.length !== characters.length) {
    values.current = characters.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      values.current.forEach((value) => value.setValue(reduceMotion ? 1 : 0));
      if (reduceMotion) return;
      Animated.stagger(stagger, values.current.map((value) =>
        Animated.timing(value, { toValue: 1, duration, delay, useNativeDriver: true }),
      )).start();
    });
    return () => {
      cancelled = true;
      values.current.forEach((value) => value.stopAnimation());
    };
  }, [children, delay, duration, stagger]);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      accessible
      accessibilityLabel={accessibilityLabel ?? children}
    >
      {characters.map((character, index) => (
        <Animated.Text
          key={`${index}-${character}`}
          accessible={false}
          style={{
            opacity: values.current[index],
            transform: [{
              translateY: values.current[index].interpolate({
                inputRange: [0, 1],
                outputRange: [4, 0],
              }),
            }],
          }}
        >
          {character === ' ' ? '\u00A0' : character}
        </Animated.Text>
      ))}
    </Text>
  );
}
