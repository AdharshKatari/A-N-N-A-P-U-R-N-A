/**
 * ScreenVisuals — Visual data displays for Market & Weather screens
 *
 * Shows data visually instead of just listing numbers:
 * - PriceTrend: mini sparkline showing price movement
 * - MarketRank: visual ranking of nearby markets
 * - TemperatureGauge: arc gauge showing temp + range
 * - ForecastBar: visual temperature range for each day
 * - MoistureGauge: circular gauge for soil/rain metrics
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, BorderRadius, Spacing, FontFamily } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// PRICE TREND — Mini sparkline showing price movement
// ============================================================================

interface PriceTrendProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function PriceTrend({ data, width = 120, height = 40, color = Colors.primaryDark }: PriceTrendProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, []);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Create points for the sparkline
  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((value - min) / range) * (height - 8) - 4,
  }));

  // Simple SVG-like rendering using views
  return (
    <View style={[styles.trendContainer, { width, height }]}>
      {/* Background grid lines */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <View
          key={pct}
          style={[styles.trendGridLine, { top: height * pct }]}
        />
      ))}

      {/* Trend line segments */}
      {points.map((point, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const segmentWidth = Math.abs(point.x - prev.x);
        const segmentHeight = Math.abs(point.y - prev.y);
        const isUp = point.y < prev.y;

        return (
          <View
            key={i}
            style={[
              styles.trendSegment,
              {
                left: Math.min(prev.x, point.x),
                top: Math.min(prev.y, point.y),
                width: segmentWidth || 1,
                height: segmentHeight || 2,
                backgroundColor: isUp ? Colors.success : Colors.error,
                opacity: 0.7,
              },
            ]}
          />
        );
      })}

      {/* Current price dot */}
      <View
        style={[
          styles.trendDot,
          {
            left: points[points.length - 1].x - 4,
            top: points[points.length - 1].y - 4,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// MARKET RANK — Visual ranking of nearby markets
// ============================================================================

interface MarketRankProps {
  markets: Array<{
    name: string;
    price: number;
    distance: number;
    isRecommended?: boolean;
  }>;
}

export function MarketRank({ markets }: MarketRankProps) {
  const maxPrice = Math.max(...markets.map((m) => m.price));

  return (
    <View style={styles.rankContainer}>
      {markets.slice(0, 4).map((market, index) => {
        const barWidth = (market.price / maxPrice) * 100;

        return (
          <View key={market.name} style={styles.rankRow}>
            <View style={styles.rankLeft}>
              <View style={[styles.rankBadge, market.isRecommended && styles.rankBadgeBest]}>
                <Text style={[styles.rankBadgeText, market.isRecommended && styles.rankBadgeTextBest]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName} numberOfLines={1}>{market.name}</Text>
                <Text style={styles.rankDistance}>{market.distance} km</Text>
              </View>
            </View>

            <View style={styles.rankRight}>
              <Text style={[styles.rankPrice, market.isRecommended && styles.rankPriceBest]}>
                ₹{market.price.toLocaleString()}
              </Text>
              <View style={styles.rankBarBg}>
                <View
                  style={[
                    styles.rankBarFill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: market.isRecommended ? Colors.primaryDark : Colors.divider,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// TEMPERATURE GAUGE — Arc gauge showing temp + daily range
// ============================================================================

interface TemperatureGaugeProps {
  temp: number;
  high: number;
  low: number;
  condition: string;
  size?: number;
}

export function TemperatureGauge({ temp, high, low, condition, size = 180 }: TemperatureGaugeProps) {
  const fillProgress = useRef(new Animated.Value(0)).current;
  const tempScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fillProgress, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: false,
      }),
      Animated.spring(tempScale, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Map temp to gauge fill (0-100 range, assume 0-50°C)
  const fillPercent = Math.min(Math.max(temp / 50, 0), 1);
  const gaugeRotation = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-120deg', `${-120 + fillPercent * 240}deg`],
  });

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      {/* Gauge background arc */}
      <View style={[styles.gaugeArc, { width: size, height: size }]}>
        <View style={[styles.gaugeArcBg, { width: size - 16, height: size - 16 }]} />
      </View>

      {/* Center content */}
      <Animated.View style={[styles.gaugeCenter, { transform: [{ scale: tempScale }] }]}>
        <Text style={styles.gaugeTemp}>{temp}°</Text>
        <Text style={styles.gaugeCondition}>{condition}</Text>
      </Animated.View>

      {/* Range labels */}
      <View style={styles.gaugeRange}>
        <View style={styles.gaugeRangeItem}>
          <Text style={styles.gaugeRangeLabel}>Low</Text>
          <Text style={styles.gaugeRangeValue}>{low}°</Text>
        </View>
        <View style={styles.gaugeRangeItem}>
          <Text style={styles.gaugeRangeLabel}>High</Text>
          <Text style={[styles.gaugeRangeValue, { color: Colors.warning }]}>{high}°</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// FORECAST BAR — Visual temperature range for each day
// ============================================================================

interface ForecastBarProps {
  day: string;
  high: number;
  low: number;
  rainChance: number;
  icon: string;
  isToday?: boolean;
  overallMin?: number;
  overallMax?: number;
}

export function ForecastBar({ day, high, low, rainChance, icon, isToday, overallMin = 15, overallMax = 40 }: ForecastBarProps) {
  const barProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barProgress, {
      toValue: 1,
      duration: 500,
      delay: isToday ? 0 : 100,
      useNativeDriver: false,
    }).start();
  }, []);

  const range = overallMax - overallMin;
  const lowPercent = ((low - overallMin) / range) * 100;
  const highPercent = ((high - overallMin) / range) * 100;
  const barWidth = highPercent - lowPercent;

  const animatedWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${barWidth}%`],
  });

  return (
    <View style={[styles.forecastBarRow, isToday && styles.forecastBarRowToday]}>
      <Text style={[styles.forecastBarDay, isToday && styles.forecastBarDayToday]}>
        {isToday ? 'Today' : day}
      </Text>

      <Text style={styles.forecastBarLow}>{low}°</Text>

      <View style={styles.forecastBarTrack}>
        <View style={[styles.forecastBarRange, { left: `${lowPercent}%` }]}>
          <Animated.View
            style={[
              styles.forecastBarFill,
              {
                width: animatedWidth,
                backgroundColor: rainChance > 30 ? Colors.info : Colors.warning,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.forecastBarHigh}>{high}°</Text>

      {rainChance > 0 && (
        <View style={styles.forecastRainBadge}>
          <Text style={styles.forecastRainText}>{rainChance}%</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MOISTURE GAUGE — Circular progress for soil/rain metrics
// ============================================================================

interface MoistureGaugeProps {
  value: number;
  label: string;
  maxValue?: number;
  color?: string;
  size?: number;
}

export function MoistureGauge({
  value,
  label,
  maxValue = 100,
  color = Colors.primaryDark,
  size = 80,
}: MoistureGaugeProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value / maxValue,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const fillHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size - 8],
  });

  return (
    <View style={[styles.moistureContainer, { width: size, height: size + 20 }]}>
      <View style={[styles.moistureCircle, { width: size, height: size }]}>
        {/* Background */}
        <View style={[styles.moistureBg, { width: size, height: size }]} />

        {/* Fill */}
        <View style={styles.moistureFillContainer}>
          <Animated.View
            style={[
              styles.moistureFill,
              {
                height: fillHeight,
                backgroundColor: color,
              },
            ]}
          />
        </View>

        {/* Value */}
        <View style={styles.moistureValueContainer}>
          <Text style={styles.moistureValue}>{value}%</Text>
        </View>
      </View>

      <Text style={styles.moistureLabel}>{label}</Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // --- Price Trend ---
  trendContainer: {
    position: 'relative',
  },
  trendGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.dividerLight,
  },
  trendSegment: {
    position: 'absolute',
    borderRadius: 1,
  },
  trendDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // --- Market Rank ---
  rankContainer: {
    gap: Spacing.sm,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeBest: {
    backgroundColor: Colors.primaryDark,
  },
  rankBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  rankBadgeTextBest: {
    color: Colors.textOnPrimary,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  rankDistance: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  rankRight: {
    alignItems: 'flex-end',
    width: 100,
  },
  rankPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rankPriceBest: {
    color: Colors.primaryDark,
    fontSize: 15,
  },
  rankBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.dividerLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  rankBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // --- Temperature Gauge ---
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeArc: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeArcBg: {
    borderRadius: 999,
    borderWidth: 6,
    borderColor: Colors.dividerLight,
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeTemp: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    color: Colors.primaryDark,
    lineHeight: 44,
  },
  gaugeCondition: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gaugeRange: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  gaugeRangeItem: {
    alignItems: 'center',
  },
  gaugeRangeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  gaugeRangeValue: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  // --- Forecast Bar ---
  forecastBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerLight,
    gap: Spacing.sm,
  },
  forecastBarRowToday: {
    backgroundColor: 'rgba(20, 92, 46, 0.04)',
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderBottomWidth: 0,
  },
  forecastBarDay: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textSecondary,
    width: 44,
  },
  forecastBarDayToday: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  forecastBarLow: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    width: 30,
    textAlign: 'right',
  },
  forecastBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dividerLight,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  forecastBarRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  forecastBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastBarHigh: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
    width: 30,
  },
  forecastRainBadge: {
    backgroundColor: Colors.infoBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  forecastRainText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.info,
  },

  // --- Moisture Gauge ---
  moistureContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moistureCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moistureBg: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 4,
    borderColor: Colors.dividerLight,
  },
  moistureFillContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    top: 4,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  moistureFill: {
    width: '100%',
    borderRadius: 999,
    opacity: 0.3,
  },
  moistureValueContainer: {
    zIndex: 1,
  },
  moistureValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.primaryDark,
  },
  moistureLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
