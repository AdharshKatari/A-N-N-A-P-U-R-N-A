import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import { GlassCard, GlassBadge } from './GlassPrimitives';
import { KisanVoiceSpeaker } from './KisanVoiceSpeaker';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BiologicalExpiryClockProps {
  cropType?: string;
  initialTemp?: number;
  baseShelfLifeDays?: number;
  visualQualityScore?: number;
  showSlider?: boolean;
  onTempChange?: (temp: number) => void;
}

export function BiologicalExpiryClock({
  cropType = 'Tomatoes',
  initialTemp = 34,
  baseShelfLifeDays = 12.0,
  visualQualityScore = 88,
  showSlider = true,
  onTempChange,
}: BiologicalExpiryClockProps) {
  const { t, language } = useLanguage();
  const [ambientTemp, setAmbientTemp] = useState<number>(initialTemp);

  // Biological Q10 Constants
  const q10 = useMemo(() => {
    const crop = cropType.toLowerCase();
    if (crop.includes('tomato')) return 2.2;
    if (crop.includes('mango')) return 2.5;
    if (crop.includes('onion')) return 2.0;
    if (crop.includes('banana')) return 2.6;
    if (crop.includes('potato')) return 1.8;
    return 2.1;
  }, [cropType]);

  // Real-time calculation based on Q10 Arrhenius kinetics
  const kinetics = useMemo(() => {
    const tempDelta = Math.max(0.0, ambientTemp - 12.0);
    const thermalSpeed = Math.pow(q10, tempDelta / 10.0);
    const qualityAdjustedBase = baseShelfLifeDays * (visualQualityScore / 100.0);
    const effectiveDaysRemaining = Math.max(0.2, qualityAdjustedBase / thermalSpeed);
    
    // Spoilage risk percentage
    const spoilageRiskPct = Math.min(98, Math.round((thermalSpeed / 4.0) * 100));

    let riskTier: 'optimal' | 'elevated' | 'critical' = 'optimal';
    let riskColor = '#4E9B42'; // Green
    let riskLabel = 'Optimal Cold-Chain';
    let riskIcon = 'check-circle';

    if (ambientTemp > 32) {
      riskTier = 'critical';
      riskColor = '#D14343'; // Red
      riskLabel = 'Thermal Spoilage Danger';
      riskIcon = 'alert-octagon';
    } else if (ambientTemp > 22) {
      riskTier = 'elevated';
      riskColor = '#E8A317'; // Amber
      riskLabel = 'Elevated Respiration';
      riskIcon = 'alert-circle';
    }

    return {
      thermalSpeed: thermalSpeed.toFixed(1),
      effectiveDaysRemaining: effectiveDaysRemaining.toFixed(1),
      spoilageRiskPct,
      riskTier,
      riskColor,
      riskLabel,
      riskIcon,
    };
  }, [cropType, ambientTemp, baseShelfLifeDays, visualQualityScore, q10]);

  const handleSliderChange = (val: number) => {
    const rounded = Math.round(val);
    setAmbientTemp(rounded);
    onTempChange?.(rounded);
  };

  const voiceSummary = useMemo(() => {
    if (language === 'hi') {
      return `${cropType} का तापमान ${ambientTemp} डिग्री सेल्सियस है। यह सामान्य से ${kinetics.thermalSpeed} गुना तेजी से खराब हो रहा है। सुरक्षित जीवन केवल ${kinetics.effectiveDaysRemaining} दिन बचा है।`;
    }
    if (language === 'mr') {
      return `${cropType} चे तापमान ${ambientTemp} अंश सेल्सिअस आहे. श्वसन वेग ${kinetics.thermalSpeed} पट वाढला आहे. उर्वरित आयुष्य ${kinetics.effectiveDaysRemaining} दिवस आहे.`;
    }
    if (language === 'te') {
      return `${cropType} ఉష్ణోగ్రత ${ambientTemp} డిగ్రీలు. ఇది ${kinetics.thermalSpeed} రెట్లు వేగంగా క్షీణిస్తుంది. మిగిలిన నిల్వ కాలం ${kinetics.effectiveDaysRemaining} రోజులు.`;
    }
    return `${cropType} at ${ambientTemp}°C is decaying at ${kinetics.thermalSpeed}x normal speed. Safe remaining shelf-life is ${kinetics.effectiveDaysRemaining} days.`;
  }, [cropType, ambientTemp, kinetics, language]);

  return (
    <GlassCard style={styles.cardContainer} variant="elevated">
      {/* Header with Q10 Badge & Voice */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="clock-fast" size={22} color={Colors.primaryDeep} />
          <Text style={styles.headerTitle}>Q10 Biological Shelf-Life Clock</Text>
        </View>
        <KisanVoiceSpeaker textToSpeak={voiceSummary} size="small" variant="filled" />
      </View>

      {/* Main Countdown Display */}
      <View style={styles.displaySection}>
        <View style={[styles.dialCircle, { borderColor: kinetics.riskColor }]}>
          <Text style={[styles.daysNumber, { color: kinetics.riskColor }]}>
            {kinetics.effectiveDaysRemaining}
          </Text>
          <Text style={styles.daysUnit}>DAYS REMAINING</Text>
          <Text style={styles.decaySubtext}>@{ambientTemp}°C Transit Heat</Text>
        </View>

        <View style={styles.statsColumn}>
          {/* Status Badge */}
          <View style={[styles.riskBadge, { backgroundColor: kinetics.riskColor + '20', borderColor: kinetics.riskColor }]}>
            <MaterialCommunityIcons name={kinetics.riskIcon as any} size={16} color={kinetics.riskColor} />
            <Text style={[styles.riskBadgeText, { color: kinetics.riskColor }]}>
              {kinetics.riskLabel}
            </Text>
          </View>

          {/* Biological Acceleration Metric */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Decay Acceleration:</Text>
            <Text style={styles.metricValue}>{kinetics.thermalSpeed}x Speed</Text>
          </View>

          {/* Q10 Factor */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Q10 Respiration Rate:</Text>
            <Text style={styles.metricValue}>{q10} / 10°C rise</Text>
          </View>

          {/* Quality Base */}
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>AGMARK Quality Score:</Text>
            <Text style={styles.metricValue}>{visualQualityScore}/100 Grade-A</Text>
          </View>
        </View>
      </View>

      {/* Interactive Temperature Slider for Live Simulation */}
      {showSlider && (
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabelRow}>
            <View style={styles.sliderTitleWithIcon}>
              <MaterialIcons name="thermostat" size={18} color={Colors.textSecondary} />
              <Text style={styles.sliderTitle}>Simulate In-Transit Heat Exposure:</Text>
            </View>
            <Text style={[styles.sliderTempText, { color: kinetics.riskColor }]}>
              {ambientTemp}°C
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={42}
            step={1}
            value={ambientTemp}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={kinetics.riskColor}
            maximumTrackTintColor="#D0D7CE"
            thumbTintColor={kinetics.riskColor}
          />

          <View style={styles.sliderMarkers}>
            <Text style={styles.markerText}>12°C (Cold Room: 12d)</Text>
            <Text style={styles.markerText}>28°C (Shaded: 8.5d)</Text>
            <Text style={styles.markerText}>38°C (Sunlight: 3.1d)</Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl || 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(107, 163, 90, 0.25)',
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  displaySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  dialCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFDF9',
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  daysUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  decaySubtext: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsColumn: {
    flex: 1,
    gap: Spacing.xs,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm || 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sliderContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sliderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sliderTempText: {
    fontSize: 14,
    fontWeight: '800',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  markerText: {
    fontSize: 9,
    color: Colors.textMuted,
  },
});
