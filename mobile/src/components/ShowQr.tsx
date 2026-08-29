import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors, Typography, FontFamily, BorderRadius, Shadows } from '../constants/theme';
import { hapticLight, hapticMedium } from '../utils/haptics';

interface ShowQrProps {
  value: string;
  buttonLabel?: string;
  onCopy?: () => void;
}

export const ShowQr = ({
  value,
  buttonLabel = 'Show QR Code',
  onCopy,
}: ShowQrProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Animated values for smooth spring transitions
  const expandAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded
  const copyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isCopied) {
      Animated.spring(copyAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        setIsCopied(false);
        Animated.timing(copyAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const toggleExpand = (expand: boolean) => {
    hapticLight();
    setIsExpanded(expand);
    Animated.spring(expandAnim, {
      toValue: expand ? 1 : 0,
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();
  };

  const handleCopy = () => {
    hapticMedium();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
    }
    setIsCopied(true);
    onCopy?.();
  };

  // Interpolated dimensions
  const cardWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 270],
  });

  const cardHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 340],
  });

  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const collapsedOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  // Fast, high-resolution QR rendering endpoint
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    value || 'freshguard-batch'
  )}&margin=10&color=145C2E`;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
          },
          isExpanded ? Shadows.glass2 : Shadows.card,
        ]}
      >
        {/* COLLAPSED STATE */}
        {!isExpanded && (
          <Animated.View
            style={[
              styles.collapsedRow,
              { opacity: collapsedOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.collapsedButton}
              onPress={() => toggleExpand(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={20}
                color={Colors.primaryDeep}
              />
              <Text style={styles.buttonLabel}>{buttonLabel}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* EXPANDED STATE */}
        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContainer,
              { opacity: contentOpacity },
            ]}
          >
            {/* QR Code Container */}
            <View style={styles.qrWrapper}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.actionsRow}>
              {/* Copy Link Pill Button */}
              <TouchableOpacity
                style={[
                  styles.copyButton,
                  isCopied && styles.copyButtonActive,
                ]}
                onPress={handleCopy}
                activeOpacity={0.8}
              >
                <Feather
                  name={isCopied ? 'check' : 'link'}
                  size={16}
                  color={isCopied ? Colors.success : Colors.textPrimary}
                />
                <Text
                  style={[
                    styles.copyText,
                    isCopied && styles.copyTextActive,
                  ]}
                >
                  {isCopied ? 'Copied Passport' : 'Copy Passport'}
                </Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => toggleExpand(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(107, 163, 90, 0.2)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedRow: {
    width: '100%',
    height: '100%',
  },
  collapsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: Colors.primaryDeep,
  },
  expandedContainer: {
    width: '100%',
    height: '100%',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrWrapper: {
    width: 210,
    height: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 12,
  },
  copyButtonActive: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  copyText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  copyTextActive: {
    color: Colors.success,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ShowQr;
