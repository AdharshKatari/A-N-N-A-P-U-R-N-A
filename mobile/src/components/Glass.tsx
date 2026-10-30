/**
 * FreshGuard Glass Components — Simplified Glassmorphism Primitives
 * 
 * Lightweight glassmorphism primitives built on the theme.ts design system.
 * These are simpler wrappers around the theme for easier migration.
 */

import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
  TextInputProps,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
  GlassLevels,
  GlassColors,
  GlassBorderRadius,
  GlassSpacing,
  GlassShadows,
  GlassMotion,
  GlassOpacity,
  GlassZIndex,
  GlassSizes,
  GlassTypography,
  GlassTokens,
} from '../constants/theme';
import { hapticLight, hapticMedium, hapticHeavy } from '../utils/haptics';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type GlassLevel = keyof typeof GlassLevels;

interface GlassCardProps {
  children: React.ReactNode;
  level?: keyof typeof GlassLevels;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  borderRadius?: number;
  testID?: string;
}

interface GlassPanelProps {
  children: React.ReactNode;
  level?: keyof typeof GlassLevels;
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg';
  borderRadius?: number;
}

interface GlassButtonProps extends Omit<PressableProps, 'children' | 'style' | 'onPress'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: 'light' | 'medium' | 'heavy';
  style?: ViewStyle;
}

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

interface GlassChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
}

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  closeOnOverlayPress?: boolean;
  onClosed?: () => void;
}

interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  snapPoints?: number[];
  initialSnap?: number;
  onClosed?: () => void;
}

interface GlassNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  tabs: Array<{ id: string; label: string; icon: string; badge?: number }>;
  style?: ViewStyle;
}

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: { icon: string; onPress: () => void; accessibilityLabel?: string };
  rightAction?: { icon: string; onPress: () => void; accessibilityLabel?: string; badge?: number };
  style?: ViewStyle;
}

interface GlassProgressProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
}

interface GlassSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface GlassSkeletonCardProps {
  style?: ViewStyle;
  variant?: 'default' | 'action' | 'metric' | 'weather';
}

interface GlassToastProps {
  message: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  // In a real app, this would use AccessibilityInfo
  useEffect(() => {
    // const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    // return () => listener?.remove?.();
  }, []);
  return reduced;
}

// ============================================================================
// GLASS CARD — Main card component with glassmorphism
// ============================================================================

export const GlassCard = forwardRef<View, GlassCardProps>(
  (
    {
      children,
      level = 'level1',
      style,
      onPress,
      disabled = false,
      haptic = 'light',
      padding = 'md',
      borderRadius,
      testID,
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const config = GlassLevels[level];
    const paddingValue = GlassSpacing.cardPadding[padding];

    const handlePressIn = useCallback(() => {
      if (disabled) return;
      if (haptic !== 'none') {
        if (haptic === 'light') hapticLight();
        else if (haptic === 'medium') hapticMedium();
        else if (haptic === 'heavy') hapticHeavy();
      }
      setPressed(true);
    }, [disabled, haptic]);

    const handlePressOut = useCallback(() => {
      setPressed(false);
    }, []);

    const handleHoverIn = useCallback(() => {
      if (!disabled) setHovered(true);
    }, [disabled]);

    const handleHoverOut = useCallback(() => {
      setHovered(false);
    }, []);

    const pressScale = disabled ? 1 : pressed ? 0.98 : 1;
    const pressOpacity = disabled ? 0.6 : pressed ? 0.9 : hovered ? 0.95 : 1;

    const borderRadiusValue = borderRadius ?? GlassLevels[level].borderRadius;

    const shadowStyle = pressed 
      ? GlassShadows.buttonPressed 
      : hovered 
        ? { ...GlassShadows.glass1, shadowOffset: { width: 0, height: 12 }, shadowRadius: 28 }
        : GlassShadows[`glass${level.slice(-1)}` as keyof typeof GlassShadows];

    return (
      <Animated.View
        ref={ref}
        style={[
          {
            borderRadius: borderRadiusValue,
            backgroundColor: GlassLevels[level].background,
            borderWidth: GlassLevels[level].borderWidth,
            borderColor: GlassLevels[level].borderColor,
            overflow: 'hidden',
            transform: [{ scale: pressScale }],
            opacity: pressOpacity,
          },
          GlassShadows[`glass${level.slice(-1)}` as keyof typeof GlassShadows],
          style,
        ]}
        testID={testID}
      >
        {Platform.OS === 'web' ? (
          <View
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: borderRadiusValue },
              { backgroundColor: 'rgba(255,255,255,0.1)' },
            ]}
            onMouseEnter={handleHoverIn}
            onMouseLeave={handleHoverOut}
          />
        ) : null}
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.98}
          android_ripple={{ color: 'rgba(20, 92, 46, 0.15)' }}
          style={({ pressed: isPressed }) => [
            { flex: 1 },
            isPressed && { opacity: 0.9 },
          ]}
        >
          <View
            style={[
              { flex: 1, padding: paddingValue },
              { borderRadius: borderRadiusValue },
            ]}
          >
            {children}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ============================================================================
// GLASS PANEL — Simple glass container without press handling
// ============================================================================

export const GlassPanel = forwardRef<View, GlassPanelProps>(
  ({ children, level = 'level1', style, padding = 'md', borderRadius }, ref) => {
    const config = GlassLevels[level];
    const paddingValue = Spacing.cardPadding[padding];
    const radius = borderRadius ?? config.borderRadius;

    return (
      <View
        ref={ref}
        style={[
          {
            backgroundColor: config.background,
            borderWidth: config.borderWidth,
            borderColor: config.borderColor,
            borderRadius: radius,
            padding: paddingValue,
          },
          config.shadow,
          style,
        ]}
      >
        {children}
      </View>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

// ============================================================================
// GLASS BUTTON — Primary interactive button with glassmorphism
// ============================================================================

const VARIANT_STYLES: Record<string, {
  background: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  glassLevel: GlassLevel;
}> = {
  primary: {
    background: GlassColors.primary,
    textColor: GlassColors.textOnPrimary,
    borderColor: 'transparent',
    borderWidth: 0,
    glassLevel: 'level2',
  },
  secondary: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.primary,
    borderColor: GlassColors.borderGlassStrong,
    borderWidth: 1.5,
    glassLevel: 'level1',
  },
  outline: {
    background: 'transparent',
    textColor: GlassColors.primary,
    borderColor: GlassColors.borderGlassStrong,
    borderWidth: 1.5,
    glassLevel: 'level1',
  },
  ghost: {
    background: 'transparent',
    textColor: GlassColors.textPrimary,
    borderColor: 'transparent',
    borderWidth: 0,
    glassLevel: 'level1',
  },
  destructive: {
    background: GlassColors.error,
    textColor: GlassColors.textOnPrimary,
    borderColor: 'transparent',
    borderWidth: 0,
    glassLevel: 'level2',
  },
};

export const GlassButton = forwardRef<View, GlassButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      haptic = 'medium',
      style,
      onPress,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const variantConfig = VARIANT_STYLES[variant];
    const sizeConfig = GlassSizes.button;

    const height = sizeConfig.height[size];
    const paddingHorizontal = sizeConfig.padding[size];
    const fontSize = GlassTypography.button.fontSize;
    const borderRadius = sizeConfig.borderRadius;

    const handlePressIn = useCallback(() => {
      if (disabled || loading) return;
      if (haptic !== 'none') {
        if (haptic === 'light') hapticLight();
        else if (haptic === 'medium') hapticMedium();
        else if (haptic === 'heavy') hapticHeavy();
      }
      setPressed(true);
    }, [disabled, loading, haptic]);

    const handlePressOut = useCallback(() => {
      setPressed(false);
    }, []);

    const handleHoverIn = useCallback(() => {
      if (!disabled && !loading) setHovered(true);
    }, [disabled, loading]);

    const handleHoverOut = useCallback(() => {
      setHovered(false);
    }, []);

    const pressScale = disabled || loading ? 1 : pressed ? 0.97 : 1;
    const pressOpacity = disabled ? 0.6 : loading ? 0.8 : pressed ? 0.9 : hovered ? 0.95 : 1;

    const isPrimary = variant === 'primary' || variant === 'destructive';
    const bgColor = variant === 'ghost' 
      ? (pressed ? GlassColors.primarySoft : hovered ? GlassColors.primaryMuted : 'transparent')
      : variantConfig.background;
    
    const textColor = variant === 'ghost'
      ? (pressed || hovered ? GlassColors.textOnPrimary : GlassColors.textPrimary)
      : variantConfig.textColor;

    const borderColor = variant === 'ghost' 
      ? 'transparent'
      : variantConfig.borderColor;

    const borderWidth = variant === 'ghost' ? 0 : variantConfig.borderWidth;

    return (
      <Animated.View
        ref={ref}
        style={[
          {
            height,
            borderRadius,
            backgroundColor: bgColor,
            borderWidth,
            borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: paddingHorizontal,
            width: fullWidth ? '100%' : undefined,
            transform: [{ scale: pressScale }],
            opacity: pressOpacity,
          },
          GlassShadows.button,
          GlassLevels[variantConfig.glassLevel].shadow,
          style,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.95}
          android_ripple={{ color: 'rgba(20, 92, 46, 0.15)' }}
          {...props}
        >
          <Animated.View
            style={[
              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
              { transform: [{ scale: pressScale }], opacity: pressOpacity },
            ]}
          >
            {loading ? (
              <Animated.View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: variantConfig.textColor,
                  borderTopColor: 'transparent',
                }}
              />
            ) : (
              <>
                {leftIcon && <View style={{ marginRight: 4 }}>{leftIcon}</View>}
                <Text
                  style={[
                    {
                      fontSize,
                      fontFamily: GlassTypography.fontFamilies.semibold,
                      fontWeight: '600',
                      color: textColor,
                      lineHeight: GlassTypography.button.lineHeight,
                    },
                  ]}
                >
                  {children}
                </Text>
                {rightIcon && <View style={{ marginLeft: 4 }}>{rightIcon}</View>}
              </>
            )}
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  }
);

GlassButton.displayName = 'GlassButton';

// ============================================================================
// GLASS INPUT — Text input with glassmorphism
// ============================================================================

export const GlassInput = forwardRef<TextInput, GlassInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      style,
      inputStyle,
      labelStyle,
      secureTextEntry = false,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [touched, setTouched] = useState(false);

    const hasError = !!error;
    const showError = hasError && touched;
    const showHelper = helperText && !showError;

    const isFocused = focused;
    const isError = hasError;

    const borderColor = isFocused
      ? GlassColors.primary
      : isError
        ? GlassColors.error
        : GlassColors.borderGlass;
    
    const borderWidth = isFocused ? 2 : 1;
    const backgroundColor = isFocused 
      ? GlassColors.surfaceGlass1 
      : GlassColors.surfaceGlass3;

    return (
      <View style={[styles.inputContainer, style]}>
        {label && (
          <Text
            style={[
              {
                fontSize: GlassTypography.label.fontSize,
                fontFamily: GlassTypography.fontFamilies.semibold,
                fontWeight: '600',
                color: GlassColors.textSecondary,
                marginBottom: GlassSpacing.xs,
                textTransform: 'uppercase',
                letterSpacing: 0.02,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
        <View style={styles.inputWrapper}>
          {leftIcon && (
            <View style={styles.iconLeft}>
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                height: GlassSizes.input.height.md,
                paddingHorizontal: GlassSizes.input.paddingHorizontal,
                borderRadius: GlassSizes.input.borderRadius,
                backgroundColor,
                borderWidth,
                borderColor,
                fontSize: GlassTypography.body.fontSize,
                fontFamily: GlassTypography.fontFamilies.regular,
                color: GlassColors.textPrimary,
                paddingRight: rightIcon ? 0 : GlassSizes.input.paddingHorizontal,
                paddingLeft: leftIcon ? 0 : GlassSizes.input.paddingHorizontal,
              },
              inputStyle,
            ]}
            ref={ref}
            secureTextEntry={secureTextEntry}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setTouched(true); }}
            onChangeText={props.onChangeText}
            onSubmitEditing={props.onSubmitEditing}
            placeholder={props.placeholder}
            placeholderTextColor={GlassColors.textPlaceholder}
            value={props.value}
            editable={props.editable}
            disabled={props.disabled}
            autoCapitalize={props.autoCapitalize}
            autoCorrect={props.autoCorrect}
            keyboardType={props.keyboardType}
            returnKeyType={props.returnKeyType}
            textContentType={props.textContentType}
            {...props}
          />
          {rightIcon && (
            <View style={styles.iconRight}>
              {rightIcon}
            </View>
          )}
          {props.clearable && props.value && (
            <TouchableOpacity
              onPress={() => props.onChangeText?.('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18, color: GlassColors.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {(showError || showHelper) && (
          <Text
            style={[
              {
                fontSize: GlassTypography.caption.fontSize,
                fontFamily: GlassTypography.fontFamilies.regular,
                marginTop: GlassSpacing.xs,
                color: showError ? GlassColors.error : GlassColors.textMuted,
              },
            ]}
          >
            {showError ? error : helperText}
          </Text>
        )}
      </View>
    );
  }
);

GlassInput.displayName = 'GlassInput';

// ============================================================================
// GLASS CHIP — Selectable chip with glassmorphism
// ============================================================================

const CHIP_VARIANTS = {
  default: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.textPrimary,
    borderColor: GlassColors.borderGlass,
    selectedBackground: GlassColors.primarySoft,
    selectedTextColor: GlassColors.textOnPrimary,
  },
  primary: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.primary,
    borderColor: GlassColors.primarySoft,
    selectedBackground: GlassColors.primary,
    selectedTextColor: GlassColors.textOnPrimary,
  },
  success: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.success,
    borderColor: GlassColors.successBg,
    selectedBackground: GlassColors.success,
    selectedTextColor: GlassColors.textOnPrimary,
  },
  warning: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.warning,
    borderColor: GlassColors.warningBg,
    selectedBackground: GlassColors.warning,
    selectedTextColor: GlassColors.textOnPrimary,
  },
  error: {
    background: GlassLevels.level1.background,
    textColor: GlassColors.error,
    borderColor: GlassColors.errorBg,
    selectedBackground: GlassColors.error,
    selectedTextColor: GlassColors.textOnPrimary,
  },
};

export const GlassChip = forwardRef<View, GlassChipProps>(
  ({ children, selected = false, onPress, variant = 'default', size = 'md', style }, ref) => {
    const config = CHIP_VARIANTS[variant];
    const isSelected = selected;
    const height = 28;
    const paddingHorizontal = 12;
    const borderRadius = 14;

    const bgColor = isSelected ? config.selectedBackground : config.background;
    const textColor = isSelected ? config.selectedTextColor : config.textColor;
    const borderColor = isSelected ? 'transparent' : config.borderColor;
    const borderWidth = isSelected ? 0 : 1;

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          {
            height: 28,
            paddingHorizontal,
            borderRadius,
            backgroundColor: bgColor,
            borderWidth: borderWidth,
            borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          GlassLevels.level1.shadow,
          style,
        ]}
        activeOpacity={0.85}
      >
        <Text
          style={{
            fontSize: GlassTypography.label.fontSize,
            fontFamily: GlassTypography.fontFamilies.semibold,
            fontWeight: '600',
            color: isSelected ? config.selectedTextColor : config.textColor,
            lineHeight: GlassTypography.label.lineHeight,
            letterSpacing: 0.02,
          }}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  }
);

GlassChip.displayName = 'GlassChip';

// ============================================================================
// GLASS BADGE — Status indicator with glassmorphism
// ============================================================================

const BADGE_VARIANTS = {
  default: { bg: GlassLevels.level1.background, color: GlassColors.textPrimary, border: GlassColors.borderGlass },
  primary: { bg: GlassColors.primarySoft, color: GlassColors.textOnPrimary, border: GlassColors.primarySoft },
  success: { bg: GlassColors.successBg, color: GlassColors.textOnPrimary, border: GlassColors.successBg },
  warning: { bg: GlassColors.warningBg, color: GlassColors.warning, border: GlassColors.warningBg },
  error: { bg: GlassColors.errorBg, color: GlassColors.error, border: GlassColors.errorBg },
  info: { bg: GlassColors.infoBg, color: GlassColors.info, border: GlassColors.infoBg },
};

export const GlassBadge = forwardRef<View, GlassBadgeProps>(
  ({ children, variant = 'default', size = 'md', dot = false, style }, ref) => {
    const config = BADGE_VARIANTS[variant];
    const isSmall = size === 'sm';
    const paddingHorizontal = isSmall ? 6 : 8;
    const paddingVertical = isSmall ? 2 : 4;
    const borderRadius = BorderRadius.full;
    const fontSize = isSmall ? GlassTypography.labelSm.fontSize : GlassTypography.label.fontSize;

    return (
      <View
        ref={ref}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal,
            paddingVertical,
            borderRadius: BorderRadius.full,
            backgroundColor: config.bg,
            borderWidth: 1,
            borderColor: config.border,
          },
          style,
        ]}
      >
        {dot && (
          <View
            style={{
              width: isSmall ? 5 : 6,
              height: isSmall ? 5 : 6,
              borderRadius: 3,
              backgroundColor: config.color,
              marginRight: 4,
            }}
          />
        )}
        <Text
          style={{
            fontSize: GlassTypography.label.fontSize,
            fontFamily: GlassTypography.fontFamilies.semibold,
            fontWeight: '600',
            color: config.color,
            lineHeight: GlassTypography.label.lineHeight,
            letterSpacing: 0.02,
          }}
        >
          {children}
        </Text>
      </View>
    );
  }
);

GlassBadge.displayName = 'GlassBadge';

// ============================================================================
// GLASS MODAL — Modal with glassmorphism
// ============================================================================

export const GlassModal = ({
  visible,
  onClose,
  children,
  title,
  subtitle,
  size = 'md',
  closeOnOverlayPress = true,
  onClosed,
}: GlassModalProps) => {
  if (!visible) return null;

  const sizes = {
    sm: { width: '85%', maxWidth: 360 },
    md: { width: '90%', maxWidth: 420 },
    lg: { width: '95%', maxWidth: 520 },
    full: { width: '100%', maxWidth: '100%' },
  };

  const config = sizes[size];

  return (
    <View style={styles.modalContainer} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeOnOverlayPress ? onClose : undefined}
        style={styles.modalOverlay}
      />
      <View
        style={[
          styles.modalContent,
          { width: config.width, maxWidth: config.maxWidth },
          GlassLevels.modal.shadow,
        ]}
      >
        {(title || subtitle) && (
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              {title && <Text style={styles.modalTitle}>{title}</Text>}
              {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, color: GlassColors.textMuted, fontWeight: '300' }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.modalBody}>{children}</View>
      </View>
    </View>
  );
};

// ============================================================================
// GLASS SHEET — Bottom sheet with glassmorphism
// ============================================================================

export const GlassSheet = ({
  visible,
  onClose,
  children,
  title,
  subtitle,
  snapPoints = [0.25, 0.5, 0.9],
  initialSnap = 1,
  onClosed,
}: GlassSheetProps) => {
  if (!visible) return null;

  return (
    <View style={styles.sheetContainer} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.sheetOverlay}
      />
      <Animated.View style={[styles.sheetContent, GlassLevels.modal.shadow]}>
        <View style={styles.sheetHandle} />
        {(title || subtitle) && (
          <View style={styles.sheetHeader}>
            {title && <Text style={styles.sheetTitle}>{title}</Text>}
            {subtitle && <Text style={styles.sheetSubtitle}>{subtitle}</Text>}
          </View>
        )}
        <View style={styles.sheetBody}>{children}</View>
      </Animated.View>
    </View>
  );
};

// ============================================================================
// GLASS NAVIGATION — Bottom tab navigation with glassmorphism
// ============================================================================

export const GlassNavigation = ({
  activeTab,
  onTabPress,
  tabs,
  style,
}: GlassNavigationProps) => {
  return (
    <View style={[styles.navContainer, GlassLevels.navigation, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.8}
          style={[
            styles.navItem,
            activeTab === tab.id && styles.navItemActive,
          ]}
        >
          <View style={[
            styles.navIconContainer,
            activeTab === tab.id && styles.navIconContainerActive,
          ]}>
            <Text style={{ fontSize: 22, color: activeTab === tab.id ? GlassColors.textOnPrimary : Colors.textMuted }}>
              {tab.icon}
            </Text>
            {tab.badge && tab.badge > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.navLabel,
            activeTab === tab.id && styles.navLabelActive,
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================================================
// GLASS HEADER — Top app bar with glassmorphism
// ============================================================================

export const GlassHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
}: GlassHeaderProps) => {
  return (
    <View style={[styles.header, GlassLevels.navigation, style]}>
      {leftAction && (
        <TouchableOpacity
          onPress={leftAction.onPress}
          style={styles.headerButton}
          activeOpacity={0.7}
          accessibilityLabel={leftAction.accessibilityLabel}
        >
          <Text style={{ fontSize: 24, color: GlassColors.primaryDark }}>{leftAction.icon}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.headerButton}
          activeOpacity={0.7}
          accessibilityLabel={rightAction.accessibilityLabel}
        >
          <Text style={{ fontSize: 24, color: GlassColors.primaryDark }}>{rightAction.icon}</Text>
          {rightAction.badge && rightAction.badge > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{rightAction.badge > 9 ? '9+' : rightAction.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// GLASS PROGRESS — Progress bar with glassmorphism
// ============================================================================

export const GlassProgress = ({
  progress,
  height = 8,
  showLabel = false,
  color = GlassColors.primary,
  backgroundColor = GlassColors.surfaceGlass3,
  borderRadius = 4,
  animated = true,
  style,
}: GlassProgressProps) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetVal = Math.min(Math.max(progress, 0), 100) / 100;
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: targetVal,
        duration: GlassMotion.duration.moderate,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(targetVal);
    }
  }, [progress, animated]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressContainer, style]}>
      <View style={[styles.progressTrack, { height, backgroundColor, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
      )}
    </View>
  );
};

// ============================================================================
// GLASS SKELETON — Loading skeleton with glassmorphism
// ============================================================================

export const GlassSkeleton = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: GlassSkeletonProps) => {
  return (
    <View style={[styles.skeleton, { width, height, borderRadius, ...style }]}>
      <Shimmer />
    </View>
  );
};

const Shimmer = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { opacity },
      ]}
    />
  );
};

export const GlassSkeletonCard = ({ style, variant = 'default' }: GlassSkeletonCardProps) => {
  return (
    <View style={[styles.skeletonCard, style]}>
      <GlassSkeleton width={60} height={60} borderRadius={30} />
      <View style={styles.skeletonCardContent}>
        <GlassSkeleton width="70%" height={16} borderRadius={4} />
        <GlassSkeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

// ============================================================================
// GLASS TOAST — Toast notification with glassmorphism
// ============================================================================

export interface GlassToastProps {
  message: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const GlassToast = ({
  message,
  variant = 'default',
  duration = 3000,
  onClose,
}: GlassToastProps) => {
  const variants = {
    default: { bg: GlassLevels.level2.background, color: GlassColors.textPrimary, icon: '📢' },
    success: { bg: GlassColors.successBg, color: GlassColors.textOnPrimary, icon: '✅' },
    error: { bg: GlassColors.errorBg, color: GlassColors.error, icon: '❌' },
    warning: { bg: GlassColors.warningBg, color: GlassColors.warning, icon: '⚠️' },
    info: { bg: GlassColors.infoBg, color: GlassColors.info, icon: 'ℹ️' },
  };

  const config = variants[variant];
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.bg },
        GlassLevels.level2.shadow,
      ]}
    >
      <View style={styles.toastContent}>
        <Text style={{ fontSize: 18, color: config.color }}>{config.icon}</Text>
        <Text style={{ ...styles.toastText, color: config.color }}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // GlassCard / GlassPanel
  inputContainer: {
    gap: GlassSpacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: GlassSizes.input.paddingHorizontal,
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    right: GlassSizes.input.paddingHorizontal,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  clearButton: {
    padding: GlassSpacing.xxs,
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 24, 0.35)',
  },
  modalContent: {
    backgroundColor: GlassLevels.modal.background,
    borderRadius: GlassLevels.modal.borderRadius,
    borderWidth: GlassLevels.modal.borderWidth,
    borderColor: GlassLevels.modal.borderColor,
    padding: Spacing.xl,
    maxHeight: '85%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: GlassTypography.h3.fontSize,
    lineHeight: GlassTypography.h3.lineHeight,
    fontWeight: '700',
    color: GlassColors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  modalSubtitle: {
    fontFamily: GlassTypography.fontFamilies.regular,
    fontSize: GlassTypography.bodyMd.fontSize,
    lineHeight: GlassTypography.bodyMd.lineHeight,
    color: GlassColors.textSecondary,
  },
  modalCloseButton: {
    padding: GlassSpacing.xxs,
  },
  modalBody: {
    gap: GlassSpacing.md,
  },
  // Sheet
  sheetContainer: {
    flex: 1,
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 24, 0.4)',
  },
  sheetContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: GlassBorderRadius.xxxl,
    borderTopRightRadius: GlassBorderRadius.xxxl,
    backgroundColor: GlassLevels.modal.background,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GlassColors.dividerLight,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GlassColors.dividerLight,
  },
  sheetTitle: {
    fontFamily: GlassTypography.fontFamilies.semibold,
    fontSize: GlassTypography.h3.fontSize,
    lineHeight: GlassTypography.h3.lineHeight,
    fontWeight: '600',
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.xxs,
  },
  sheetSubtitle: {
    fontFamily: GlassTypography.fontFamilies.regular,
    fontSize: GlassTypography.bodyMd.fontSize,
    lineHeight: GlassTypography.bodyMd.lineHeight,
    color: GlassColors.textSecondary,
  },
  sheetBody: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  // Navigation
  navContainer: {
    flexDirection: 'row',
    height: 72,
    paddingBottom: 14,
    paddingTop: 8,
    paddingHorizontal: Spacing.md,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingVertical: Spacing.xxs,
  },
  navItemActive: {
    backgroundColor: GlassColors.primarySoft,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  navIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainerActive: {
    backgroundColor: GlassColors.primarySoft,
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: GlassColors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: 9,
    fontWeight: '700',
    color: GlassColors.textOnPrimary,
  },
  navLabel: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: GlassColors.textMuted,
    marginTop: 2,
  },
  navLabelActive: {
    color: GlassColors.primary,
    fontWeight: '700',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.headerPadding,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: GlassTypography.h4.fontSize,
    lineHeight: GlassTypography.h4.lineHeight,
    fontWeight: '700',
    color: GlassColors.primaryDeep,
  },
  headerSubtitle: {
    fontFamily: GlassTypography.fontFamilies.regular,
    fontSize: GlassTypography.small.fontSize,
    lineHeight: GlassTypography.small.lineHeight,
    color: GlassColors.textSecondary,
    marginTop: GlassTypography.small.lineHeight * 0.1,
  },
  headerBadge: {
    backgroundColor: GlassColors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: 9,
    fontWeight: '700',
    color: GlassColors.textOnPrimary,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {},
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
    textAlign: 'right',
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toastText: {
    fontSize: 15,
    color: '#1D1C16',
    flex: 1,
  },
  // Skeleton
  skeleton: {
    backgroundColor: GlassColors.surfaceAlt,
    borderRadius: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  skeletonCard: {
    backgroundColor: GlassColors.surface,
    borderRadius: GlassBorderRadius.lg,
    padding: GlassSpacing.cardPaddingSm,
    gap: GlassSpacing.sm,
    ...GlassShadows.glass1,
  },
  skeletonCardContent: {
    gap: GlassSpacing.xs,
  },
  // Input
  inputContainer: {
    gap: GlassSpacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: GlassSizes.input.paddingHorizontal,
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    right: GlassSizes.input.paddingHorizontal,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  clearButton: {
    padding: GlassSpacing.xxs,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {},
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
    textAlign: 'right',
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toastText: {
    fontSize: 15,
    color: '#1D1C16',
    flex: 1,
  },
  // Skeleton
  skeleton: {
    backgroundColor: GlassColors.surfaceAlt,
    borderRadius: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  skeletonCard: {
    backgroundColor: GlassColors.surface,
    borderRadius: GlassBorderRadius.lg,
    padding: GlassSpacing.cardPaddingSm,
    gap: GlassSpacing.sm,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  skeletonCardContent: {
    gap: GlassSpacing.xs,
  },
  // Input
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: 16,
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 24, 0.35)',
  },
  modalContent: {
    backgroundColor: GlassLevels.modal.background,
    borderRadius: GlassLevels.modal.borderRadius,
    borderWidth: GlassLevels.modal.borderWidth,
    borderColor: GlassLevels.modal.borderColor,
    padding: Spacing.xl,
    maxHeight: '85%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: GlassTypography.fontFamilies.bold,
    fontSize: GlassTypography.h3.fontSize,
    lineHeight: GlassTypography.h3.lineHeight,
    fontWeight: '700',
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.xxs,
  },
  modalSubtitle: {
    fontFamily: GlassTypography.fontFamilies.regular,
    fontSize: GlassTypography.bodyMd.fontSize,
    lineHeight: GlassTypography.bodyMd.lineHeight,
    color: GlassColors.textSecondary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  modalBody: {
    gap: GlassSpacing.md,
  },
  // Sheet
  sheetContainer: {
    flex: 1,
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 24, 0.4)',
  },
  sheetContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: GlassBorderRadius.xxxl,
    borderTopRightRadius: GlassBorderRadius.xxxl,
    backgroundColor: GlassLevels.modal.background,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GlassColors.dividerLight,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GlassColors.dividerLight,
  },
  sheetTitle: {
    fontFamily: GlassTypography.fontFamilies.semibold,
    fontSize: GlassTypography.h3.fontSize,
    lineHeight: GlassTypography.h3.lineHeight,
    fontWeight: '600',
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.xxs,
  },
  sheetSubtitle: {
    fontFamily: GlassTypography.fontFamilies.regular,
    fontSize: GlassTypography.bodyMd.fontSize,
    color: GlassColors.textSecondary,
    marginTop: 2,
  },
  sheetBody: {
    padding: GlassSpacing.lg,
    paddingBottom: GlassSpacing.xxxl,
  },
  // Input
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: 16,
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
});

export {
  // Tokens
  GlassColors,
  GlassLevels,
  GlassSpacing,
  GlassBorderRadius,
  GlassShadows,
  GlassMotion,
  GlassOpacity,
  GlassZIndex,
  GlassSizes,
  GlassTypography,
};

export {
  MotionTokens,
  FadeIn,
  ScaleIn,
  SlideIn,
  AnimatedPressable,
  StaggerList,
  PressableCard,
  PulseView,
  SkeletonPlaceholder,
  TransitionView,
} from './MotionSystem';
