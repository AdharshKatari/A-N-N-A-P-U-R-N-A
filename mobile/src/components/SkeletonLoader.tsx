import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCard } from './Animations';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'profile' | 'weather' | 'custom';
  count?: number;
  style?: any;
}

/**
 * Skeleton loader component for different content types.
 * Shows animated placeholder content while data is loading.
 */
export function SkeletonLoader({ type = 'card', count = 1, style }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard />;
      
      case 'list':
        return (
          <View style={styles.listItem}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <View style={styles.listContent}>
              <Skeleton width="80%" height={16} borderRadius={4} />
              <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        );
      
      case 'profile':
        return (
          <View style={styles.profileContainer}>
            <Skeleton width={100} height={100} borderRadius={50} />
            <Skeleton width="60%" height={20} borderRadius={4} style={{ marginTop: 16 }} />
            <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        );
      
      case 'weather':
        return (
          <View style={styles.weatherContainer}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={styles.weatherInfo}>
              <Skeleton width="50%" height={32} borderRadius={4} />
              <Skeleton width="70%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        );
      
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          {renderSkeleton()}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  item: {
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  weatherInfo: {
    flex: 1,
    marginLeft: 16,
  },
});
