import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontFamily,
  Typography,
  Shadows,
} from '../constants/theme';

interface ScreenHeaderProps {
  /** Title text (e.g. "Weather", "Market") */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Whether to show back button */
  showBack?: boolean;
  /** Navigation goBack function */
  onBack?: () => void;
  /** Optional right action icon (MaterialIcons name) */
  rightIcon?: any;
  /** Right icon press handler */
  onRightPress?: () => void;
  /** Optional avatar URL for right side */
  avatarUrl?: string;
  /** Optional avatar press handler */
  onAvatarPress?: () => void;
}

/**
 * Reusable screen header with consistent layout.
 * Provides: back button (optional) | title+subtitle | right action (optional)
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ ←        PAGE TITLE          👤 │
 * │          subtitle               │
 * └─────────────────────────────────┘
 */
export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  avatarUrl,
  onAvatarPress,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconSpacer} />
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      {avatarUrl ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onAvatarPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : rightIcon ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRightPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Open ${String(rightIcon).replace(/-/g, ' ')}`}
        >
          <MaterialIcons name={rightIcon} size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.headerPadding,
    ...Shadows.header,
    zIndex: 40,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 44,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.xs,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '700',
    color: Colors.primaryDark,
    maxWidth: '100%',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
    maxWidth: '100%',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
  },
});
