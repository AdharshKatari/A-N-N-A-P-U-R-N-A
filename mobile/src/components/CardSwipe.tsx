import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Colors } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

interface CardSwipeProps {
  children: React.ReactNode;
  gap?: number;
  maxCardWidth?: number;
}

export default function CardSwipe({ children, gap = 12, maxCardWidth = 340 }: CardSwipeProps) {
  const items = useMemo(() => React.Children.toArray(children), [children]);
  const { width } = useWindowDimensions();
  // Safe responsive card width: fits neatly on smaller screens like Realme/Redmi while allowing full breathing room
  const cardWidth = Math.min(maxCardWidth, width - 40);
  const interval = cardWidth + gap;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<any>(null);
  const [index, setIndex] = useState(0);

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.max(
      0,
      Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.x / interval))
    );
    if (next !== index) hapticLight();
    setIndex(next);
  };

  const goTo = (next: number) => {
    hapticLight();
    setIndex(next);
    scroller.current?.scrollTo({ x: next * interval, animated: true });
  };

  if (!items.length) return null;

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        contentContainerStyle={[styles.track, { gap, paddingHorizontal: 4 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={settle}
        scrollEventThrottle={16}
      >
        {items.map((child, itemIndex) => {
          const inputRange = [
            (itemIndex - 1) * interval,
            itemIndex * interval,
            (itemIndex + 1) * interval,
          ];
          return (
            <Animated.View
              key={itemIndex}
              style={{
                width: cardWidth,
                opacity: scrollX.interpolate({
                  inputRange,
                  outputRange: [0.85, 1, 0.85],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scale: scrollX.interpolate({
                      inputRange,
                      outputRange: [0.97, 1, 0.97],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }}
            >
              {child}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.dots}>
        {items.map((_, dotIndex) => (
          <Pressable
            key={dotIndex}
            accessibilityRole="button"
            accessibilityLabel={`Show option ${dotIndex + 1} of ${items.length}`}
            accessibilityState={{ selected: index === dotIndex }}
            hitSlop={8}
            onPress={() => goTo(dotIndex)}
            style={[styles.dot, index === dotIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -4,
  },
  track: {
    paddingVertical: 8,
  },
  dots: {
    minHeight: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primaryDeep,
  },
});
