import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import AnimatedNumber from './AnimatedNumber';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';

interface AdaptiveSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (value: number) => void;
  markers?: number[];
}

export default function AdaptiveSlider({
  label, value, min, max, step, unit, decimals = 0, onChange, markers,
}: AdaptiveSliderProps) {
  const percentage = (value - min) / Math.max(1, max - min);
  const color = percentage < .5 ? '#145C2E' : percentage < .72 ? '#E8A317' : '#8A57C7';
  const ticks = useMemo(() => markers ?? [min, min + (max - min) / 3, min + (max - min) * 2 / 3, max], [markers, min, max]);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <AnimatedNumber value={value} decimals={decimals} useGrouping style={[styles.value, { color }]} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <View style={styles.sliderWrap}>
        <View pointerEvents="none" style={styles.dots}>
          {ticks.map((tick) => <View key={tick} style={styles.dot} />)}
        </View>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor={Colors.divider}
          thumbTintColor="#FFFFFF"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: `${value} ${unit}` }}
        />
      </View>
      <View style={styles.markers}>
        {ticks.map((tick) => (
          <Text key={tick} style={styles.marker}>{Number.isInteger(tick) ? tick : tick.toFixed(1)}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, borderColor: Colors.divider, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface, ...Shadows.button },
  label: { textAlign: 'center', fontFamily: FontFamily.bold, fontSize: 13, color: Colors.textMuted },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 5, marginTop: 5, marginBottom: 10 },
  value: { fontFamily: FontFamily.bold, fontSize: 38, lineHeight: 46 },
  unit: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textPrimary },
  sliderWrap: { height: 42, justifyContent: 'center' },
  slider: { width: '100%', height: 42, zIndex: 2 },
  dots: { position: 'absolute', left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9C3DF' },
  markers: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  marker: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.textMuted },
});
