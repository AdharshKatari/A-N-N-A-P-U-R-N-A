import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';
import { GlowingAreaChart } from './GlowingAreaChart';

export type TimelineOption = '7d' | '30d' | '90d' | '1y';

interface TimelineData {
  label: string;
  metrics: {
    avgPrice: string;
    avgChange: string;
    peakPrice: string;
    peakMarket: string;
    arrivalVol: string;
    arrivalTrend: string;
    decayIndex: string;
  };
  chartBars: { label: string; price: number; height: number; isPeak?: boolean }[];
  priceRange: { low: string; high: string };
  factors: { title: string; score: string; status: string; color: string }[];
}

const TIMELINE_DATA: Record<TimelineOption, TimelineData> = {
  '7d': {
    label: 'Last 7 Days',
    metrics: {
      avgPrice: '₹2,580',
      avgChange: '+8.4% 📈',
      peakPrice: '₹3,350',
      peakMarket: 'Vashi Mumbai',
      arrivalVol: '1,450 q',
      arrivalTrend: '+12% Supply',
      decayIndex: '9.2 Days',
    },
    priceRange: { low: '₹2,150', high: '₹2,650' },
    chartBars: [
      { label: 'Mon', price: 2150, height: 35 },
      { label: 'Tue', price: 2220, height: 42 },
      { label: 'Wed', price: 2350, height: 55 },
      { label: 'Thu', price: 2400, height: 62 },
      { label: 'Fri', price: 2480, height: 72 },
      { label: 'Sat', price: 2550, height: 80 },
      { label: 'Sun', price: 2650, height: 95, isPeak: true },
    ],
    factors: [
      { title: 'Weather & Highway Transit', score: '94/100', status: 'Optimal', color: '#145C2E' },
      { title: 'Terminal Mandi Buyer Demand', score: '88/100', status: 'Very High', color: '#2E7D32' },
      { title: 'Crop Spoilage Decay Risk', score: 'Low (3%)', status: 'Safe', color: '#145C2E' },
    ],
  },
  '30d': {
    label: 'Last 30 Days',
    metrics: {
      avgPrice: '₹2,420',
      avgChange: '+14.2% 📈',
      peakPrice: '₹3,400',
      peakMarket: 'Vashi Mumbai',
      arrivalVol: '6,200 q',
      arrivalTrend: 'Steady Demand',
      decayIndex: '8.8 Days',
    },
    priceRange: { low: '₹1,900', high: '₹2,800' },
    chartBars: [
      { label: 'W1', price: 1950, height: 30 },
      { label: 'W2', price: 2200, height: 50 },
      { label: 'W3', price: 2450, height: 70 },
      { label: 'W4', price: 2800, height: 95, isPeak: true },
    ],
    factors: [
      { title: 'Seasonal Supply Shift', score: '78/100', status: 'Moderate', color: '#D97706' },
      { title: 'Buyer Competition Index', score: '92/100', status: 'High', color: '#145C2E' },
      { title: 'Average Transit Margin', score: '+₹420/q', status: 'Profitable', color: '#145C2E' },
    ],
  },
  '90d': {
    label: 'Season Q3',
    metrics: {
      avgPrice: '₹2,280',
      avgChange: '+22.5% 📈',
      peakPrice: '₹3,500',
      peakMarket: 'Pune / Mumbai',
      arrivalVol: '18,500 q',
      arrivalTrend: 'Peak Harvest',
      decayIndex: '8.4 Days',
    },
    priceRange: { low: '₹1,600', high: '₹3,100' },
    chartBars: [
      { label: 'Jun', price: 1650, height: 30 },
      { label: 'Jul', price: 2100, height: 55 },
      { label: 'Aug', price: 2650, height: 90, isPeak: true },
    ],
    factors: [
      { title: 'Monsoon Impact Factor', score: '65/100', status: 'Moderate', color: '#D97706' },
      { title: 'Storage & Cold Chain Access', score: '82/100', status: 'Good', color: '#2E7D32' },
      { title: 'Overall Yield Realization', score: '91/100', status: 'Excellent', color: '#145C2E' },
    ],
  },
  '1y': {
    label: 'Annual Cycle',
    metrics: {
      avgPrice: '₹2,150',
      avgChange: '+31.0% 📈',
      peakPrice: '₹3,800',
      peakMarket: 'Metro Terminals',
      arrivalVol: '74,000 q',
      arrivalTrend: 'Annual Cycle',
      decayIndex: '8.0 Days',
    },
    priceRange: { low: '₹1,200', high: '₹3,800' },
    chartBars: [
      { label: 'Q1', price: 1400, height: 25 },
      { label: 'Q2', price: 1900, height: 50 },
      { label: 'Q3', price: 2600, height: 80 },
      { label: 'Q4', price: 3400, height: 100, isPeak: true },
    ],
    factors: [
      { title: 'Annual Price Appreciation', score: '+31%', status: 'Bullish', color: '#145C2E' },
      { title: 'Smart Move Cumulative Gain', score: '+₹48.5K', status: 'Realized', color: '#145C2E' },
      { title: 'Crop Rotation Health', score: '89/100', status: 'High', color: '#2E7D32' },
    ],
  },
};

export interface MarketTrendsAnalyticsProps {
  cropName?: string;
  onClose?: () => void;
  style?: ViewStyle;
}

export function MarketTrendsAnalytics({
  cropName = 'Tomato',
  onClose,
  style,
}: MarketTrendsAnalyticsProps) {
  const [timeline, setTimeline] = useState<TimelineOption>('7d');
  const activeData = TIMELINE_DATA[timeline];

  const handleTimelineChange = (t: TimelineOption) => {
    hapticSelection();
    setTimeline(t);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Header Row with Title & Timeline Dropdown/Switcher */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.mainTitle}>{cropName} Market Trends</Text>
          <Text style={styles.subTitle}>Historical movement & price analytics</Text>
        </View>

        {/* Timeline Switcher Chips */}
        <View style={styles.timelineSwitcher}>
          {(['7d', '30d', '90d', '1y'] as TimelineOption[]).map((t) => {
            const isActive = timeline === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.timelineChip, isActive && styles.timelineChipActive]}
                onPress={() => handleTimelineChange(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timelineChipText, isActive && styles.timelineChipTextActive]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4 Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Avg Modal Price */}
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <MaterialIcons name="payments" size={18} color="#145C2E" />
          </View>
          <Text style={styles.metricLabel}>Average Price</Text>
          <Text style={styles.metricValue}>{activeData.metrics.avgPrice}</Text>
          <Text style={styles.metricSub}>{activeData.metrics.avgChange}</Text>
        </View>

        {/* Metric 2: Peak Spread */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialIcons name="trending-up" size={18} color="#D97706" />
          </View>
          <Text style={styles.metricLabel}>Top APMC Peak</Text>
          <Text style={[styles.metricValue, { color: '#D97706' }]}>{activeData.metrics.peakPrice}</Text>
          <Text style={styles.metricSub}>{activeData.metrics.peakMarket}</Text>
        </View>

        {/* Metric 3: Arrival Volume */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <MaterialIcons name="inventory" size={18} color="#0284C7" />
          </View>
          <Text style={styles.metricLabel}>Arrival Volume</Text>
          <Text style={styles.metricValue}>{activeData.metrics.arrivalVol}</Text>
          <Text style={styles.metricSub}>{activeData.metrics.arrivalTrend}</Text>
        </View>

        {/* Metric 4: Shelf Life Retention */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F3E8FF' }]}>
            <MaterialIcons name="timer" size={18} color="#7E22CE" />
          </View>
          <Text style={styles.metricLabel}>Shelf Life</Text>
          <Text style={styles.metricValue}>{activeData.metrics.decayIndex}</Text>
          <Text style={styles.metricSub}>Avg Safe Transit</Text>
        </View>
      </View>

      {/* Main Interactive Price Trajectory Glowing Area Chart */}
      <GlowingAreaChart
        title={`${activeData.label} Price Evolution`}
        subtitle="Daily modal rate trajectory (₹ / Quintal)"
        badgeLabel={activeData.metrics.avgChange}
        badgePositive={true}
        data={activeData.chartBars.map((b) => ({ label: b.label, value: b.price }))}
        unit="₹"
        color="#145C2E"
        chartHeight={160}
      />

      {/* Market Factors & Profitability Index */}
      <View style={styles.factorsCard}>
        <Text style={styles.factorsHeading}>Market Recovery & Profitability Factors</Text>
        <View style={styles.factorsList}>
          {activeData.factors.map((factor, idx) => (
            <View key={idx} style={styles.factorRow}>
              <View style={[styles.factorDot, { backgroundColor: factor.color }]} />
              <Text style={styles.factorTitle}>{factor.title}</Text>
              <View style={styles.factorValueBadge}>
                <Text style={[styles.factorScoreText, { color: factor.color }]}>{factor.score}</Text>
                <Text style={styles.factorStatusText}>({factor.status})</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  titleCol: {
    flex: 1,
  },
  mainTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  timelineSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  timelineChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timelineChipActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  timelineChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#145C2E',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Shadows.card,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metricSub: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#145C2E',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  chartSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  rangeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rangeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#4B5563',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingTop: 10,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  barPriceTag: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
  },
  barPill: {
    width: 26,
    backgroundColor: '#A5D6A7',
    borderRadius: 6,
  },
  barPillPeak: {
    backgroundColor: '#145C2E',
  },
  barLabelText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  barLabelTextPeak: {
    fontFamily: FontFamily.bold,
    color: '#145C2E',
  },
  factorsCard: {
    backgroundColor: '#FAF9F5',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.12)',
  },
  factorsHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  factorsList: {
    gap: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  factorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  factorTitle: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
  },
  factorValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  factorScoreText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  factorStatusText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#6B7280',
  },
});
