/**
 * PriceHeatmap — Visual heatmap showing price levels across markets
 *
 * Color-codes markets by price intensity: green = cheap, yellow = mid, red = expensive.
 * Shows a grid of market cells with prices and relative intensity.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, Typography } from '../constants/theme';

interface PriceHeatmapProps {
  prices: Array<{
    market: string;
    price: number;
    distance?: number;
  }>;
}

function getPriceColor(price: number, min: number, max: number): string {
  const ratio = max === min ? 0.5 : (price - min) / (max - min);
  if (ratio < 0.25) return '#1B7A3D';   // deep green — cheapest
  if (ratio < 0.45) return '#4CAF50';   // green
  if (ratio < 0.65) return '#FFA726';   // amber
  return '#E53935';                       // red — most expensive
}

function getPriceLabel(price: number, min: number, max: number): string {
  const ratio = max === min ? 0.5 : (price - min) / (max - min);
  if (ratio < 0.25) return 'Best Price';
  if (ratio < 0.45) return 'Good Price';
  if (ratio < 0.65) return 'Average';
  return 'High Price';
}

export default function PriceHeatmap({ prices }: PriceHeatmapProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (prices.length === 0) return null;

  const allPrices = prices.map((p) => p.price);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1B7A3D' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Mid-Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
          <Text style={styles.legendText}>Mid-High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
      </View>

      {/* Heatmap Grid */}
      <View style={styles.grid}>
        {prices.map((item, i) => {
          const color = getPriceColor(item.price, min, max);
          const label = getPriceLabel(item.price, min, max);
          const isBest = item.price === min;

          return (
            <View key={item.market} style={styles.cell}>
              <View style={[styles.cellInner, { backgroundColor: color }]}>
                <Text style={styles.cellMarket} numberOfLines={1}>
                  {item.market}
                </Text>
                <Text style={styles.cellPrice}>₹{item.price.toLocaleString()}</Text>
                <Text style={styles.cellLabel}>{label}</Text>
                {isBest && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>★ BEST</Text>
                  </View>
                )}
              </View>
              <View style={styles.cellDistance}>
                <Text style={styles.cellDistanceText}>{item.distance} km</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          Price range: ₹{min.toLocaleString()} – ₹{max.toLocaleString()} / quintal
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cell: {
    width: '48%',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  cellInner: {
    padding: Spacing.sm,
    gap: Spacing.xxs,
  },
  cellMarket: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cellPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  cellLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bestBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xxs,
  },
  bestBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cellDistance: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  cellDistanceText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  summaryRow: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
