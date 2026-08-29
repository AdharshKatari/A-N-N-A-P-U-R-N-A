import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flip, AnimatedPressable } from './Animations';
import { hapticMedium } from '../utils/haptics';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  width?: number;
  height?: number;
  onPress?: () => void;
  style?: any;
}

/**
 * Interactive flip card component.
 * Flips on press to reveal back content.
 */
export function FlipCard({
  frontContent,
  backContent,
  width = 300,
  height = 200,
  onPress,
  style,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePress = () => {
    hapticMedium();
    setIsFlipped(!isFlipped);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.container, { width, height }, style]}
      enableHaptics={false}
    >
      <Flip
        isFlipped={isFlipped}
        frontContent={
          <View style={[styles.cardFace, styles.frontFace]}>
            {frontContent}
          </View>
        }
        backContent={
          <View style={[styles.cardFace, styles.backFace]}>
            {backContent}
          </View>
        }
      />
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// CropFlipCard — Specialized flip card for crop information
// ---------------------------------------------------------------------------

interface CropFlipCardProps {
  cropName: string;
  status: string;
  daysToHarvest: number;
  moisture: number;
  soilTemp: number;
  style?: any;
}

export function CropFlipCard({
  cropName,
  status,
  daysToHarvest,
  moisture,
  soilTemp,
  style,
}: CropFlipCardProps) {
  const frontContent = (
    <View style={styles.cropFront}>
      <Text style={styles.cropName}>{cropName}</Text>
      <View style={[styles.statusBadge, { backgroundColor: status === 'Healthy' ? Colors.successBg : Colors.warningBg }]}>
        <Text style={[styles.statusText, { color: status === 'Healthy' ? Colors.primaryDark : Colors.warning }]}>
          {status}
        </Text>
      </View>
      <Text style={styles.tapHint}>Tap to see details</Text>
    </View>
  );

  const backContent = (
    <View style={styles.cropBack}>
      <Text style={styles.detailsTitle}>Crop Details</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Days to Harvest:</Text>
        <Text style={styles.detailValue}>{daysToHarvest} days</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Moisture:</Text>
        <Text style={styles.detailValue}>{moisture}%</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Soil Temp:</Text>
        <Text style={styles.detailValue}>{soilTemp}°C</Text>
      </View>
    </View>
  );

  return (
    <FlipCard
      frontContent={frontContent}
      backContent={backContent}
      width={280}
      height={180}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardFace: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  frontFace: {
    backgroundColor: Colors.surface,
  },
  backFace: {
    backgroundColor: Colors.primaryDark,
  },
  // Crop card specific styles
  cropFront: {
    alignItems: 'center',
    gap: 12,
  },
  cropName: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h2.fontSize,
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.label.fontSize,
  },
  tapHint: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  cropBack: {
    gap: 12,
  },
  detailsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h3.fontSize,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.textOnPrimary,
  },
  detailValue: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.bodyMd.fontSize,
    color: Colors.textOnPrimary,
  },
});
