import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
} from '../constants/theme';

// ─── Error Fallback UI ─────────────────────────────────

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  screenName?: string;
}

export function ErrorFallback({ error, resetError, screenName }: ErrorFallbackProps) {
  return (
    <SafeAreaView style={fallbackStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={fallbackStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Icon */}
        <View style={fallbackStyles.iconContainer}>
          <View style={fallbackStyles.iconCircle}>
            <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          </View>
        </View>

        {/* Error Title */}
        <Text style={fallbackStyles.title}>Something went wrong</Text>
        <Text style={fallbackStyles.subtitle}>
          {screenName
            ? `The ${screenName} screen encountered an unexpected error.`
            : 'An unexpected error occurred.'}
        </Text>

        {/* Error Details Card */}
        <View style={fallbackStyles.errorCard}>
          <View style={fallbackStyles.errorHeader}>
            <MaterialIcons name="bug-report" size={18} color={Colors.textSecondary} />
            <Text style={fallbackStyles.errorHeaderText}>Error Details</Text>
          </View>
          <Text style={fallbackStyles.errorMessage} numberOfLines={6}>
            {error.message || 'Unknown error'}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={fallbackStyles.primaryButton}
          onPress={resetError}
          activeOpacity={0.85}
        >
          <MaterialIcons name="refresh" size={20} color={Colors.textOnPrimary} />
          <Text style={fallbackStyles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={fallbackStyles.helpText}>
          If this keeps happening, check your connection or restart the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const fallbackStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xxl * 2,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h2.fontSize,
    lineHeight: Typography.h2.lineHeight,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorHeaderText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.label.fontSize,
    lineHeight: Typography.label.lineHeight,
    letterSpacing: 0.4,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textMuted,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    width: '100%',
    backgroundColor: Colors.primaryDark,
    height: 56,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.sm,
    ...Shadows.glass2,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  helpText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

// ─── Error Boundary Class Component ────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error in dev
    if (__DEV__) {
      console.error(`[ErrorBoundary] ${this.props.screenName || 'Screen'} crashed:`, error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          screenName={this.props.screenName}
        />
      );
    }

    return this.props.children;
  }
}

// ─── Convenience HOC ───────────────────────────────────

/**
 * Wrap any screen component with an error boundary.
 *
 * Usage:
 *   export default withErrorBoundary(WeatherScreen, 'Weather');
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName?: string,
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Screen';

  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary screenName={screenName || displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}
