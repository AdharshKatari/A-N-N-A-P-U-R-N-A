import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

export interface FarmInsight {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  trend: string;
  value: string;
  label: string;
  tint: string;
  onPress?: () => void;
}

export default function FarmInsightsCarousel({ cards }: { cards: FarmInsight[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 72, 310);
  const gap = 18;
  const interval = cardWidth + gap;
  const x = useRef(new Animated.Value(0)).current;
  const scroll = useRef<any>(null);
  const [index, setIndex] = useState(0);
  if (!cards.length) return null;
  return (
    <View>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>FARM INSIGHTS</Text>
          <Text style={styles.heading}>At a glance</Text>
        </View>
        <Text style={styles.swipeHint}>Swipe</Text>
      </View>
      <Animated.ScrollView
        ref={scroll}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        disableIntervalMomentum
        decelerationRate="fast"
        contentContainerStyle={{ gap, paddingHorizontal: 6, paddingVertical: 15 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / interval);
          if (next !== index) hapticLight();
          setIndex(Math.max(0, Math.min(cards.length - 1, next)));
        }}
        scrollEventThrottle={16}
      >
        {cards.map((card, cardIndex) => {
          const range = [(cardIndex - 1) * interval, cardIndex * interval, (cardIndex + 1) * interval];
          return (
            <Animated.View key={card.id} style={{
              width: cardWidth,
              opacity: x.interpolate({ inputRange: range, outputRange: [0.42, 1, 0.42], extrapolate: 'clamp' }),
              transform: [
                { perspective: 900 },
                { rotateZ: x.interpolate({ inputRange: range, outputRange: ['8deg', '0deg', '-8deg'], extrapolate: 'clamp' }) },
                { scale: x.interpolate({ inputRange: range, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' }) },
              ],
            }}>
              <Pressable onPress={card.onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={card.icon} size={38} color={Colors.primaryDeep} />
                </View>
                <View style={styles.trendBadge}>
                  <MaterialIcons name="arrow-upward" size={13} color={Colors.textOnPrimary} />
                  <Text style={styles.trendText}>{card.trend}</Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.value}>{card.value}</Text>
                <Text style={styles.label}>{card.label}</Text>
                <View style={[styles.tint, { backgroundColor: card.tint }]} />
                <View style={styles.arrowBox}>
                  <MaterialIcons name="north-east" size={19} color={Colors.textMuted} />
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.dots}>
        {cards.map((card, dotIndex) => (
          <Pressable key={card.id} accessibilityRole="button"
            accessibilityLabel={`Show ${card.label}`} accessibilityState={{ selected: index === dotIndex }}
            onPress={() => { setIndex(dotIndex); scroll.current?.scrollTo({ x: dotIndex * interval, animated: true }); }}
            style={[styles.dot, index === dotIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 2 },
  eyebrow: { fontFamily: FontFamily.bold, fontSize: 10, letterSpacing: 1, color: Colors.primaryDeep },
  heading: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
  swipeHint: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.textMuted },
  card: { height: 270, justifyContent: 'flex-start', borderWidth: 1, borderColor: Colors.divider, borderRadius: 24,
    backgroundColor: Colors.surface, padding: 20, overflow: 'hidden', ...Shadows.glass2 },
  iconBox: { width: 70, height: 70, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  trendBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9,
    backgroundColor: Colors.successBg, paddingHorizontal: 9, paddingVertical: 4, marginTop: 22 },
  trendText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textOnPrimary },
  value: { fontFamily: FontFamily.bold, fontSize: 38, lineHeight: 46, color: Colors.textPrimary, marginTop: 5 },
  label: { fontFamily: FontFamily.semibold, fontSize: 17, color: Colors.textSecondary },
  tint: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: -65, top: -55, opacity: .32 },
  arrowBox: { position: 'absolute', right: 18, bottom: 18, width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.divider },
  dotActive: { width: 20, backgroundColor: Colors.primaryDeep },
  pressed: { opacity: .84, transform: [{ scale: .985 }] },
});
