/**
 * OnboardingScreen — Visual Product Demonstrations
 *
 * Three screens that SHOW the product, not just describe it:
 * 1. SEE — AI scan visualization with quality metrics
 * 2. COMPARE — Side-by-side Sell vs Store cards
 * 3. DECIDE — AI recommendation with projected profit
 *
 * Architecture: scrollX-driven per-slide animations.
 * Bottom zone: unified dots + CTA + counter.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, FontFamily } from '../constants/theme';
import { hapticMedium } from '../utils/haptics';
import { AIScanVisual, ComparisonVisual, RecommendationVisual } from '../components/OnboardingVisuals';

const slides = [
  {
    visual: 'scan' as const,
    headline: 'Know before it spoils.',
    description: 'AI analyzes your crop and warns you before quality drops.',
    ctaText: 'See your options',
  },
  {
    visual: 'compare' as const,
    headline: 'Compare every move.',
    description: 'Know the potential value and risk before deciding.',
    ctaText: 'Get the answer',
  },
  {
    visual: 'decide' as const,
    headline: 'Make the move that pays more.',
    description: 'Clear recommendations based on your crop, market, and risk.',
    ctaText: "Let's grow smarter",
  },
];

const SPRING_SNAPPY = { tension: 120, friction: 10 };

export default function OnboardingScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Dot animations
  const dotWidths = useRef(slides.map((_, i) => new Animated.Value(i === 0 ? 24 : 8))).current;
  const dotOpacities = useRef(slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.4))).current;

  const animateDots = useCallback((newIndex: number) => {
    slides.forEach((_, i) => {
      const isActive = i === newIndex;
      Animated.parallel([
        Animated.spring(dotWidths[i], {
          toValue: isActive ? 24 : 8,
          ...SPRING_SNAPPY,
          useNativeDriver: false,
        }),
        Animated.timing(dotOpacities[i], {
          toValue: isActive ? 1 : 0.4,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [dotWidths, dotOpacities]);

  const updateSlide = useCallback((index: number) => {
    currentSlideRef.current = index;
    setCurrentSlide(index);
    animateDots(index);
  }, [animateDots]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    updateSlide(index);
  }, [width, updateSlide]);

  // Exit animation value
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const isExiting = useRef(false);

  const goToNext = useCallback(() => {
    if (isExiting.current) return;
    hapticMedium();
    const idx = currentSlideRef.current;
    if (idx < slides.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (idx + 1) * width, animated: true });
    } else {
      // Animate exit before navigating to Language
      isExiting.current = true;
      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(exitScale, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('Language');
      });
    }
  }, [width, navigation, exitOpacity, exitScale]);

  const goToSlide = useCallback((index: number) => {
    hapticMedium();
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  }, [width]);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.exitWrapper,
          {
            opacity: exitOpacity,
            transform: [{ scale: exitScale }],
          },
        ]}
      >
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {slides.map((s, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [24, 0, -24],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.95, 1, 0.95],
            extrapolate: 'clamp',
          });

          // Visual slides slightly faster for parallax
          const visualY = scrollX.interpolate({
            inputRange,
            outputRange: [16, 0, -16],
            extrapolate: 'clamp',
          });

          const VisualComponent =
            s.visual === 'scan' ? AIScanVisual :
            s.visual === 'compare' ? ComparisonVisual :
            RecommendationVisual;

          return (
            <View key={index} style={[styles.slide, { width }]}>
              <Animated.View
                style={[
                  styles.slideContent,
                  {
                    opacity,
                    transform: [{ translateY }],
                  },
                ]}
              >
                {/* Visual demonstration */}
                <Animated.View style={[styles.visualWrapper, { transform: [{ translateY: visualY }, { scale }] }]}>
                  <VisualComponent isActive={currentSlide === index} />
                </Animated.View>

                {/* Text content */}
                <Text style={styles.headline}>{s.headline}</Text>
                <Text style={styles.description}>{s.description}</Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Unified bottom action zone */}
      <View style={styles.bottomZone}>
        {/* Progress counter */}
        <Text style={styles.counter}>
          {currentSlide + 1} of {slides.length}
        </Text>

        {/* Dots + CTA row */}
        <View style={styles.actionRow}>
          {/* Dot indicators */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <Pressable key={index} onPress={() => goToSlide(index)}>
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      width: dotWidths[index],
                      opacity: dotOpacities[index],
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {/* CTA button */}
          <Pressable style={styles.ctaButton} onPress={goToNext} android_ripple={{ color: 'rgba(255,255,255,0.15)' }}>
            <Text style={styles.ctaText}>{slide.ctaText}</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>
        </View>

        {/* Subtle swipe hint */}
        {!isLastSlide && (
          <Text style={styles.swipeHint}>Swipe to explore</Text>
        )}
      </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  exitWrapper: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 40,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  visualWrapper: {
    marginBottom: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h1.fontSize,
    lineHeight: Typography.h1.lineHeight,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // --- Unified Bottom Zone ---
  bottomZone: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 50,
    paddingTop: Spacing.md,
  },
  counter: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryDark,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  ctaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textOnPrimary,
  },
  swipeHint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    opacity: 0.6,
  },
});
