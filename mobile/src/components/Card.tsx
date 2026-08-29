import React, { useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontFamily,
  Typography,
  Shadows,
} from '../constants/theme';
import { hapticLight } from '../utils/haptics';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

type CardBorderType = 'neutral' | 'green' | 'amber' | 'red' | 'none';

interface CardProps {
  children: React.ReactNode;
  /** Semantic border type */
  border?: CardBorderType;
  /** Compact padding (20px) instead of default (24px) */
  compact?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

const BORDER_COLORS: Record<CardBorderType, string> = {
  neutral: Colors.divider,
  green: Colors.success,
  amber: Colors.warning,
  red: Colors.error,
  none: 'transparent',
};

/**
 * Reusable card component with consistent styling.
 * Supports semantic border colors and press feedback.
 */
export function Card({ children, border = 'neutral', compact = false, style }: CardProps) {
  const borderColor = border === 'none' ? 'transparent' : BORDER_COLORS[border];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.card,
          compact && styles.cardCompact,
          border !== 'none' && { borderWidth: 1, borderColor },
          { transform: [{ scale }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Badge / Pill
// ---------------------------------------------------------------------------

type BadgeVariant = 'green' | 'amber' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  green: { bg: Colors.successBg, text: Colors.textOnDark },
  amber: { bg: Colors.warningBg, text: Colors.warning },
  red: { bg: Colors.errorBg, text: Colors.error },
  gray: { bg: Colors.surfaceAlt, text: Colors.textSecondary },
};

/**
 * Reusable badge/pill component with semantic color variants.
 */
export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const colors = BADGE_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SectionTitle
// ---------------------------------------------------------------------------

interface SectionTitleProps {
  children: React.ReactNode;
}

/**
 * Consistent section heading for grouping content.
 */
export function SectionTitle({ children }: SectionTitleProps) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

/**
 * Consistent horizontal divider line for inside cards.
 */
export function CardDivider() {
  return <View style={styles.divider} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  cardCompact: {
    padding: Spacing.cardPaddingSm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
});
