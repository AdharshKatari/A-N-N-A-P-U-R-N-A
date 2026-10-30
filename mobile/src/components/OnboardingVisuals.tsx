/**
 * OnboardingVisuals — Visual product demonstrations
 *
 * Three screens that SHOW the product, not just describe it:
 * 1. AI Scan — camera scanning fruit with quality metrics
 * 2. Compare — side-by-side Sell vs Store cards
 * 3. Decide — AI recommendation with projected profit
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, BorderRadius, Spacing, FontFamily, Shadows } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VISUAL_WIDTH = Math.min(SCREEN_WIDTH - 80, 320);

// ============================================================================
// SCREEN 1: AI SCAN VISUALIZATION
// Camera frame → crop detection → quality analysis
// ============================================================================

export function AIScanVisual({ isActive }: { isActive: boolean }) {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.8)).current;
  const metricOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    // Scan line sweeps down
    const scanLoop = Animated.loop(
      Animated.timing(scanLineY, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );

    // Score appears after scan
    const scoreTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scoreOpacity, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Metrics appear after score
    const metricTimer = setTimeout(() => {
      Animated.timing(metricOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1200);

    scanLoop.start();

    return () => {
      scanLoop.stop();
      clearTimeout(scoreTimer);
      clearTimeout(metricTimer);
      scoreOpacity.setValue(0);
      scoreScale.setValue(0.8);
      metricOpacity.setValue(0);
    };
  }, [isActive]);

  const scanLineTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const scoreProgress = scoreScale.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0, 0.92],
  });

  return (
    <View style={styles.visualContainer}>
      {/* Scan frame */}
      <View style={styles.scanFrame}>
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Crop icon */}
        <Text style={styles.cropEmoji}>🍅</Text>

        {/* Scanning line */}
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY: scanLineTranslateY }],
            },
          ]}
        />

        {/* Quality score ring */}
        <Animated.View
          style={[
            styles.scoreRing,
            {
              opacity: scoreOpacity,
              transform: [{ scale: scoreScale }],
            },
          ]}
        >
          <View style={styles.scoreOuter}>
            <View style={styles.scoreInner}>
              <Text style={styles.scoreValue}>92</Text>
              <Text style={styles.scoreLabel}>Quality</Text>
            </View>
          </View>
        </Animated.View>

        {/* Status badge */}
        <Animated.View style={[styles.statusBadge, { opacity: metricOpacity }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>LOW RISK</Text>
        </Animated.View>
      </View>

      {/* Metrics row */}
      <Animated.View style={[styles.metricsRow, { opacity: metricOpacity }]}>
        <View style={styles.metricChip}>
          <Text style={styles.metricIcon}>💧</Text>
          <Text style={styles.metricValue}>72%</Text>
          <Text style={styles.metricLabel}>Moisture</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricIcon}>🌡️</Text>
          <Text style={styles.metricValue}>24°C</Text>
          <Text style={styles.metricLabel}>Temp</Text>
        </View>
        <View style={styles.metricChip}>
          <Text style={styles.metricIcon}>📅</Text>
          <Text style={styles.metricValue}>3d</Text>
          <Text style={styles.metricLabel}>Fresh</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// SCREEN 2: COMPARISON VISUALIZATION
// Side-by-side cards: Sell Now vs Store 3 Days
// ============================================================================

export function ComparisonVisual({ isActive }: { isActive: boolean }) {
  const card1X = useRef(new Animated.Value(-40)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2X = useRef(new Animated.Value(40)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    card1X.setValue(-40);
    card1Opacity.setValue(0);
    card2X.setValue(40);
    card2Opacity.setValue(0);
    badgeOpacity.setValue(0);

    // Cards slide in from sides
    Animated.parallel([
      Animated.spring(card1X, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(card1Opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(card2X, {
        toValue: 0,
        tension: 60,
        friction: 12,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(card2Opacity, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // "Best option" badge appears
    const badgeTimer = setTimeout(() => {
      Animated.spring(badgeOpacity, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 600);

    return () => clearTimeout(badgeTimer);
  }, [isActive]);

  return (
    <View style={styles.visualContainer}>
      <View style={styles.comparisonRow}>
        {/* Sell card */}
        <Animated.View
          style={[
            styles.comparisonCard,
            {
              opacity: card1Opacity,
              transform: [{ translateX: card1X }],
            },
          ]}
        >
          <View style={styles.compCardHeader}>
            <Text style={styles.compCardTitle}>SELL TODAY</Text>
          </View>
          <Text style={styles.compPrice}>₹42,000</Text>
          <View style={styles.compRisk}>
            <View style={[styles.riskDot, { backgroundColor: Colors.success }]} />
            <Text style={[styles.riskText, { color: Colors.primaryDeep }]}>Low risk</Text>
          </View>
          <Text style={styles.compNote}>Market stable, prices fair</Text>
        </Animated.View>

        {/* Store card */}
        <Animated.View
          style={[
            styles.comparisonCard,
            styles.comparisonCardHighlight,
            {
              opacity: card2Opacity,
              transform: [{ translateX: card2X }],
            },
          ]}
        >
          <View style={styles.compCardHeaderHighlight}>
            <Text style={styles.compCardTitleHighlight}>STORE 3 DAYS</Text>
          </View>
          <Text style={[styles.compPrice, { color: Colors.primaryDark }]}>₹48,500</Text>
          <View style={styles.compRisk}>
            <View style={[styles.riskDot, { backgroundColor: Colors.warning }]} />
            <Text style={[styles.riskText, { color: Colors.warning }]}>Medium risk</Text>
          </View>
          <Text style={styles.compNote}>Prices expected to rise</Text>

          {/* Best option badge */}
          <Animated.View style={[styles.bestBadge, { opacity: badgeOpacity }]}>
            <Text style={styles.bestBadgeText}>BETTER VALUE ✓</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

// ============================================================================
// SCREEN 3: RECOMMENDATION VISUALIZATION
// AI recommendation card with projected profit
// ============================================================================

export function RecommendationVisual({ isActive }: { isActive: boolean }) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const profitOpacity = useRef(new Animated.Value(0)).current;
  const profitY = useRef(new Animated.Value(12)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    cardOpacity.setValue(0);
    cardScale.setValue(0.92);
    profitOpacity.setValue(0);
    profitY.setValue(12);

    // Card entrance
    Animated.parallel([
      Animated.spring(cardOpacity, {
        toValue: 1,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Profit appears
    const profitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(profitOpacity, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(profitY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Glow pulse
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      clearTimeout(profitTimer);
      glowLoop.stop();
    };
  }, [isActive]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.2],
  });

  return (
    <View style={styles.visualContainer}>
      <Animated.View
        style={[
          styles.recommendationCard,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        {/* Glow background */}
        <Animated.View style={[styles.recGlow, { opacity: glowOpacity }]} />

        {/* AI badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeIcon}>✨</Text>
          <Text style={styles.aiBadgeText}>AI RECOMMENDS</Text>
        </View>

        {/* Recommendation */}
        <Text style={styles.recAction}>STORE FOR 2 DAYS</Text>

        <View style={styles.recDivider} />

        {/* Profit section */}
        <Animated.View
          style={[
            styles.profitSection,
            {
              opacity: profitOpacity,
              transform: [{ translateY: profitY }],
            },
          ]}
        >
          <Text style={styles.profitLabel}>Expected return</Text>
          <Text style={styles.profitValue}>₹52,400</Text>
          <View style={styles.profitBadge}>
            <Text style={styles.profitBadgeText}>+18% potential</Text>
          </View>
        </Animated.View>

        {/* Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.reasonText}>
            Based on your crop quality, market trends, and spoilage risk.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: VISUAL_WIDTH,
    alignSelf: 'center',
  },

  // --- Scan Frame ---
  scanFrame: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(20, 92, 46, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 92, 46, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primaryDark,
    borderWidth: 2.5,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  cropEmoji: {
    fontSize: 64,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primaryDark,
    opacity: 0.6,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreRing: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  scoreOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  scoreLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: Colors.textSecondary,
    lineHeight: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textOnPrimary,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },

  // --- Metrics Row ---
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  metricIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  metricLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // --- Comparison Cards ---
  comparisonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  comparisonCardHighlight: {
    borderColor: Colors.primaryDark,
    borderWidth: 1.5,
  },
  compCardHeader: {
    marginBottom: Spacing.sm,
  },
  compCardHeaderHighlight: {
    marginBottom: Spacing.sm,
  },
  compCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  compCardTitleHighlight: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  compPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: Spacing.xs,
  },
  compRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  riskDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  riskText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },
  compNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  bestBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  bestBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.textOnPrimary,
    letterSpacing: 0.3,
  },

  // --- Recommendation Card ---
  recommendationCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
    padding: Spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.banner,
  },
  recGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 92, 46, 0.18)',
    borderRadius: BorderRadius.xl,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 92, 46, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  aiBadgeIcon: {
    fontSize: 14,
  },
  aiBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  recAction: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: Colors.primaryDark,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
  },
  recDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.divider,
    borderRadius: 1,
    marginBottom: Spacing.md,
  },
  profitSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profitLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  profitValue: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: Colors.primaryDark,
    lineHeight: 38,
  },
  profitBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  profitBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.textOnPrimary,
  },
  reasonSection: {
    marginTop: Spacing.xs,
  },
  reasonText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
