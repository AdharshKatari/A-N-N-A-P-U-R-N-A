import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Typography, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface AnalyzingCropViewProps {
  onComplete?: () => void;
  cropName?: string;
  isReady?: boolean; // When backend response is received
}

const RING_SIZE = 190;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STEPS = [
  { id: 'quality', label: 'Detecting quality' },
  { id: 'ripeness', label: 'Checking ripeness' },
  { id: 'damages', label: 'Identifying damages' },
  { id: 'freshness', label: 'Estimating freshness' },
];

export default function AnalyzingCropView({
  onComplete,
  cropName = 'crop',
  isReady = false,
}: AnalyzingCropViewProps) {
  const [progressPercent, setProgressPercent] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const animatedProgress = useRef(new Animated.Value(15)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Continuous spinner rotation for the active step
  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinAnim]);

  // Stage progression timer (0s -> 25% -> 50% -> 75% -> 100%)
  useEffect(() => {
    let t1: NodeJS.Timeout | undefined;
    let t2: NodeJS.Timeout | undefined;
    let t3: NodeJS.Timeout | undefined;

    // Step 1: 0 to 25%
    Animated.timing(animatedProgress, {
      toValue: 28,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setProgressPercent(28);
    setCurrentStepIndex(0);

    // Step 2: 50%
    t1 = setTimeout(() => {
      Animated.timing(animatedProgress, {
        toValue: 52,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      setProgressPercent(52);
      setCurrentStepIndex(1);
    }, 700);

    // Step 3: 75%
    t2 = setTimeout(() => {
      Animated.timing(animatedProgress, {
        toValue: 75,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      setProgressPercent(75);
      setCurrentStepIndex(2);
    }, 1500);

    // Step 4: 90%
    t3 = setTimeout(() => {
      Animated.timing(animatedProgress, {
        toValue: 92,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      setProgressPercent(92);
      setCurrentStepIndex(3);
    }, 2400);

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [animatedProgress]);

  // When backend analysis finishes, fast-forward to 100%
  useEffect(() => {
    if (isReady) {
      Animated.timing(animatedProgress, {
        toValue: 100,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      setProgressPercent(100);
      setCurrentStepIndex(4);

      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [isReady, animatedProgress, onComplete]);

  // Stroke Dashoffset calculation
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * progressPercent) / 100;

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header Tag */}
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>2.1 Analyzing Screen</Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {/* Circular Progress Indicator */}
        <View style={styles.ringWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
            <Defs>
              <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#10B981" />
                <Stop offset="100%" stopColor="#047857" />
              </LinearGradient>
            </Defs>

            {/* Background Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#E2E8F0"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />

            {/* Active Progress Ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="url(#progressGradient)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>

          {/* Central Percentage */}
          <View style={styles.ringCenterText}>
            <Text style={styles.percentNumber}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Analyzing your crop</Text>
        <Text style={styles.subtitle}>
          Evaluating multi-sample firmness, colorimetry, and freshness
        </Text>

        {/* Step-by-Step Checklist */}
        <View style={styles.checklistContainer}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <View key={step.id} style={styles.stepRow}>
                {/* Left Icon */}
                <View style={styles.stepLeftIcon}>
                  {isCompleted ? (
                    <MaterialIcons name="check" size={18} color="#059669" />
                  ) : isActive ? (
                    <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                      <MaterialCommunityIcons name="loading" size={18} color="#10B981" />
                    </Animated.View>
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>

                {/* Step Label */}
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>

                {/* Right Status Icon */}
                <View style={styles.stepRightIcon}>
                  {isCompleted ? (
                    <MaterialIcons name="check" size={18} color="#059669" />
                  ) : isActive ? (
                    <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                      <MaterialCommunityIcons name="loading" size={16} color="#10B981" />
                    </Animated.View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
  },
  headerBadge: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  headerBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.body.fontSize,
    color: '#166534',
    fontWeight: '700',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Shadows.card,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  svgRing: {
    position: 'absolute',
  },
  ringCenterText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 46,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
  },
  checklistContainer: {
    width: '100%',
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  stepLeftIcon: {
    width: 26,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 6,
  },
  stepLabelCompleted: {
    color: '#0F172A',
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#047857',
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  stepRightIcon: {
    width: 26,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginLeft: 4,
  },
});
