/**
 * MarketDetailSheet — Bottom sheet showing market details
 *
 * Slides up from bottom when a market marker is tapped.
 * Shows: market name, price, distance, rating, hours, contact, and a mini price trend.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MarketDetailSheetProps {
  visible: boolean;
  market: {
    market: string;
    price: number;
    distance?: number;
    isRecommended?: boolean;
    latitude?: number;
    longitude?: number;
  } | null;
  onClose: () => void;
  onNavigate?: (market: any) => void;
}

const MARKET_HOURS = '6:00 AM – 2:00 PM';
const MARKET_CONTACT = '+91 98765 43210';
const MARKET_RATINGS = [4.5, 4.2, 3.8, 4.0, 3.5];

export default function MarketDetailSheet({
  visible,
  market,
  onClose,
  onNavigate,
}: MarketDetailSheetProps) {
  const translateY = useRef(new Animated.Value(36)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && market) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 36,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, market]);

  if (!market) return null;

  const rating = MARKET_RATINGS[0];
  const priceHistory = [
    market.price - 80,
    market.price - 40,
    market.price + 20,
    market.price - 10,
    market.price,
  ];
  const trendUp = priceHistory[priceHistory.length - 1] >= priceHistory[0];

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }, { scale }] }]}
          >
            {/* Drag Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close market details"
              onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Market Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.marketName}>{market.market}</Text>
                <View style={styles.distanceRow}>
                  <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
                  <Text style={styles.distanceText}>{market.distance} km away</Text>
                </View>
              </View>
              {market.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <MaterialIcons name="star" size={14} color={Colors.textOnPrimary} />
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}
            </View>

            {/* Price & Trend */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Current Price</Text>
                <Text style={styles.priceValue}>₹{market.price.toLocaleString()}<Text style={styles.priceUnit}>/q</Text></Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: trendUp ? Colors.successBg : Colors.errorBg }]}>
                <MaterialIcons
                  name={trendUp ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={trendUp ? Colors.textOnPrimary : Colors.error}
                />
                <Text style={[styles.trendText, { color: trendUp ? Colors.textOnPrimary : Colors.error }]}>
                  {trendUp ? '+2.1%' : '-1.3%'}
                </Text>
              </View>
            </View>

            {/* Mini Price Trend */}
            <View style={styles.trendChart}>
              <View style={styles.trendChartHeader}>
                <Text style={styles.trendChartTitle}>7-Day Price Trend</Text>
                <Text style={styles.trendChartSubtext}>Low: ₹{Math.min(...priceHistory).toLocaleString()} · High: ₹{Math.max(...priceHistory).toLocaleString()}</Text>
              </View>
              <View style={styles.trendBarRow}>
                {priceHistory.map((price, i) => {
                  const min = Math.min(...priceHistory);
                  const max = Math.max(...priceHistory);
                  const range = max - min || 1;
                  const barHeight = ((price - min) / range) * 40 + 10;
                  const isLast = i === priceHistory.length - 1;
                  return (
                    <View key={i} style={styles.trendBarCol}>
                      <View style={[styles.trendBar, { height: barHeight, backgroundColor: isLast ? Colors.primaryDark : Colors.chipGreen }]} />
                      <Text style={[styles.trendBarLabel, isLast && { color: Colors.primaryDark, fontFamily: FontFamily.bold }]}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <MaterialIcons name="schedule" size={18} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>{MARKET_HOURS}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="phone" size={18} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{MARKET_CONTACT}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="star" size={18} color={Colors.warning} />
                <Text style={styles.infoLabel}>Rating</Text>
                <Text style={styles.infoValue}>{rating} / 5</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="local-shipping" size={18} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Delivery</Text>
                <Text style={styles.infoValue}>Available</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onNavigate?.(market);
                }}
              >
                <MaterialIcons name="navigation" size={18} color={Colors.textOnPrimary} />
                <Text style={styles.primaryButtonText}>Show Path on Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={() => {
                  Linking.openURL('tel:+919876543210').catch(() => {});
                }}
              >
                <MaterialIcons name="call" size={18} color={Colors.primaryDark} />
                <Text style={styles.secondaryButtonText}>Call Mandi</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    paddingBottom: 24,
    maxHeight: SCREEN_HEIGHT * 0.82,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
    ...Shadows.modal,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 13,
    zIndex: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: Spacing.xxs,
  },
  marketName: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h3.fontSize,
    lineHeight: Typography.h3.lineHeight,
    color: Colors.primaryDark,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  distanceText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    color: Colors.textMuted,
  },
  recommendedBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  recommendedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.textOnPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  priceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    color: Colors.textMuted,
    marginBottom: Spacing.xxs,
  },
  priceValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.primaryDark,
  },
  priceUnit: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.body.fontSize,
    color: Colors.textMuted,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  trendText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.caption.fontSize,
  },
  trendChart: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  trendChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  trendChartTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.textPrimary,
  },
  trendChartSubtext: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  trendBarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    gap: 4,
  },
  trendBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  trendBar: {
    width: '100%',
    maxWidth: 32,
    borderRadius: BorderRadius.sm / 2,
  },
  trendBarLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoItem: {
    width: '47%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xxs,
  },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  infoValue: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.button,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    color: Colors.textOnPrimary,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    color: Colors.primaryDark,
  },
});
