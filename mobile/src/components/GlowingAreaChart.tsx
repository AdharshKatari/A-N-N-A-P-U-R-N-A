import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Line,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';

export interface DataPoint {
  label: string;
  value: number;
  secondaryVal?: string;
}

export interface GlowingAreaChartProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  badgePositive?: boolean;
  data?: DataPoint[];
  unit?: string;
  color?: string;
  chartHeight?: number;
  style?: ViewStyle;
}

const DEFAULT_DATA: DataPoint[] = [
  { label: 'W1', value: 64 },
  { label: 'W2', value: 78 },
  { label: 'W3', value: 52 },
  { label: 'W4', value: 92 },
  { label: 'W5', value: 85 },
  { label: 'W6', value: 110 },
  { label: 'W7', value: 98 },
  { label: 'W8', value: 125 },
];

/**
 * Computes smooth cubic Bezier curve path string for an array of (x, y) coordinates
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || curr;
    const nextNext = points[i + 2] || next;

    // Control point 1
    const cp1x = curr.x + (next.x - prev.x) * 0.16;
    const cp1y = curr.y + (next.y - prev.y) * 0.16;

    // Control point 2
    const cp2x = next.x - (nextNext.x - curr.x) * 0.16;
    const cp2y = next.y - (nextNext.y - curr.y) * 0.16;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }

  return d;
}

export function GlowingAreaChart({
  title = 'Mandi Market Signups & Trades',
  subtitle = 'Weekly trade & price realization trends',
  badgeLabel = '+144%',
  badgePositive = true,
  data = DEFAULT_DATA,
  unit = '',
  color = '#145C2E',
  chartHeight = 160,
  style,
}: GlowingAreaChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(data.length - 1);
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width - 64);

  const selectedPoint = data[selectedIndex] || data[data.length - 1];

  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin || dataMax * 0.1 || 1;
  const minVal = Math.max(0, dataMin - range * 0.4);
  const maxVal = dataMax + range * 0.3;

  const paddingLeft = 16;
  const paddingRight = 16;
  const paddingTop = 28;
  const paddingBottom = 30;

  const graphWidth = Math.max(100, containerWidth - paddingLeft - paddingRight);
  const graphHeight = Math.max(80, chartHeight - paddingTop - paddingBottom);

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * graphWidth;
    const normalized = (d.value - minVal) / (maxVal - minVal || 1);
    const y = paddingTop + (1 - Math.min(1, Math.max(0, normalized))) * graphHeight;
    return { x, y, data: d };
  });

  const linePath = createSmoothPath(points);

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const bottomY = chartHeight - paddingBottom;
  const areaPath = `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

  const handlePointPress = (index: number) => {
    hapticSelection();
    setSelectedIndex(index);
  };

  return (
    <View
      style={[styles.card, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
      }}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{title}</Text>
            {badgeLabel ? (
              <View style={[styles.badge, badgePositive ? styles.badgePos : styles.badgeNeg]}>
                <MaterialCommunityIcons
                  name={badgePositive ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={badgePositive ? '#145C2E' : '#C62828'}
                />
                <Text style={[styles.badgeText, badgePositive ? styles.badgeTextPos : styles.badgeTextNeg]}>
                  {badgeLabel}
                </Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        {/* Selected Data Tooltip Pill */}
        {selectedPoint && (
          <View style={styles.tooltipPill}>
            <View style={styles.tooltipDot} />
            <Text style={styles.tooltipLabel}>{selectedPoint.label}: </Text>
            <Text style={styles.tooltipVal}>
              {unit}{selectedPoint.value.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* SVG Chart Area */}
      <View style={{ width: '100%', height: chartHeight }}>
        <Svg width={containerWidth} height={chartHeight}>
          <Defs>
            {/* Glowing Gradient Fill: 35% opacity down to 0% */}
            <LinearGradient id="glowingAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <Stop offset="50%" stopColor={color} stopOpacity="0.12" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>

            {/* Glowing underlay stroke gradient */}
            <LinearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={color} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Horizontal Dashed Grid Lines */}
          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const y = paddingTop + frac * graphHeight;
            return (
              <Line
                key={idx}
                x1={paddingLeft}
                y1={y}
                x2={containerWidth - paddingRight}
                y2={y}
                stroke="rgba(0, 0, 0, 0.05)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#glowingAreaGrad)" />

          {/* Glow Underlay Stroke Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeOpacity={0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Stroke Line */}
          <Path
            d={linePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points (Glowing Dots with white borders) */}
          {points.map((pt, i) => {
            const isSelected = selectedIndex === i;
            return (
              <G key={i}>
                {/* Glow Outer Halo for Selected Point */}
                {isSelected && (
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={9}
                    fill={color}
                    fillOpacity={0.25}
                  />
                )}
                {/* Main Dot */}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 5.5 : 4}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </G>
            );
          })}
        </Svg>

        {/* Transparent touch targets for each data point */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {points.map((pt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handlePointPress(i)}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                left: pt.x - 18,
                top: 0,
                bottom: paddingBottom,
                width: 36,
              }}
            />
          ))}
        </View>
      </View>

      {/* X-Axis Labels Row */}
      <View style={styles.xAxisRow}>
        {data.map((d, i) => {
          const isSelected = selectedIndex === i;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handlePointPress(i)}
              style={styles.xAxisItem}
              activeOpacity={0.7}
            >
              <Text style={[styles.xAxisText, isSelected && styles.xAxisTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePos: {
    backgroundColor: '#E8F5E9',
  },
  badgeNeg: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextPos: {
    color: '#145C2E',
  },
  badgeTextNeg: {
    color: '#C62828',
  },
  subtitleText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#145C2E',
    marginRight: 5,
  },
  tooltipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  tooltipVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#145C2E',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  xAxisItem: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  xAxisText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#9CA3AF',
  },
  xAxisTextActive: {
    fontFamily: FontFamily.bold,
    color: '#145C2E',
  },
});
