import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticMedium } from '../utils/haptics';

export interface FloatingDisclosureItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  badgeBg?: string;
  onPress: () => void;
}

export interface FloatingDisclosureProps {
  items?: FloatingDisclosureItem[];
  navigation?: any;
  style?: ViewStyle;
}

export function FloatingDisclosure({ items, navigation, style }: FloatingDisclosureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const defaultItems: FloatingDisclosureItem[] = [
    {
      id: 'add-crop',
      title: 'Add Crop Batch',
      description: 'Log new field planting',
      icon: 'add-circle-outline',
      iconColor: '#145C2E',
      badgeBg: '#E8F5E9',
      onPress: () => navigation?.navigate('AddCrop'),
    },
    {
      id: 'scan-disease',
      title: 'Scan Crop Health',
      description: 'AI leaf & rot detection',
      icon: 'camera-alt',
      iconColor: '#E65100',
      badgeBg: '#FFF3E0',
      onPress: () => navigation?.navigate('Scan'),
    },
    {
      id: 'check-mandi',
      title: 'Check Mandi Prices',
      description: 'Live APMC rates & trends',
      icon: 'store',
      iconColor: '#145C2E',
      badgeBg: '#E8F5E9',
      onPress: () => navigation?.navigate('Market'),
    },
    {
      id: 'smart-move',
      title: 'Smart Move Logistics',
      description: 'Compare transit profits',
      icon: 'local-shipping',
      iconColor: '#D97706',
      badgeBg: '#FEF3C7',
      onPress: () => navigation?.navigate('SmartMove'),
    },
  ];

  const actionItems = items || defaultItems;

  const toggleOpen = () => {
    if (isOpen) {
      hapticLight();
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start(() => setIsOpen(false));
    } else {
      hapticMedium();
      setIsOpen(true);
      Animated.parallel([
        Animated.spring(expandAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 1,
          tension: 90,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleItemPress = (item: FloatingDisclosureItem) => {
    hapticMedium();
    toggleOpen();
    item.onPress();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const cardScale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const cardOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <>
      {/* Floating Action Trigger Button */}
      <View style={[styles.floatingAnchor, style]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.triggerButton}
          onPress={toggleOpen}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="add" size={26} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Expanded Actions Modal / Popover */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={toggleOpen}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={toggleOpen}
          >
            <Animated.View
              style={[
                styles.expandedCard,
                {
                  opacity: cardOpacity,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              {/* Card Header with morphing close button */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderTitleRow}>
                  <View style={styles.headerDot} />
                  <Text style={styles.cardHeaderTitle}>Quick Actions</Text>
                </View>
                <TouchableOpacity
                  style={styles.headerCloseBtn}
                  onPress={toggleOpen}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Action items list */}
              <View style={styles.itemList}>
                {actionItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={styles.actionRow}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.iconBox, { backgroundColor: item.badgeBg || '#F3F4F6' }]}>
                      <MaterialIcons name={item.icon} size={20} color={item.iconColor || '#145C2E'} />
                    </View>
                    <View style={styles.textCol}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingAnchor: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    zIndex: 99,
  },
  triggerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 10, 0.45)',
    justifyContent: 'flex-end',
    paddingBottom: 90,
    paddingHorizontal: 20,
  },
  expandedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    padding: 16,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'flex-start',
    ...Shadows.modal,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#145C2E',
  },
  cardHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  headerCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  itemDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
});
