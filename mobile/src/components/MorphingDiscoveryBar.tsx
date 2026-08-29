import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  ViewStyle,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';

export interface DiscoveryCategory {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  activeColor?: string;
  activeTextColor?: string;
}

export interface MorphingDiscoveryBarProps {
  categories?: DiscoveryCategory[];
  activeCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  searchValue: string;
  onChangeSearch: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

const DEFAULT_CATEGORIES: DiscoveryCategory[] = [
  { id: 'all', label: 'All Crops', icon: 'grid-view' },
  { id: 'tomato', label: 'Tomato', icon: 'grass' },
  { id: 'onion', label: 'Onion', icon: 'grain' },
  { id: 'paddy', label: 'Paddy', icon: 'eco' },
  { id: 'mango', label: 'Mango', icon: 'nature' },
];

export function MorphingDiscoveryBar({
  categories = DEFAULT_CATEGORIES,
  activeCategoryId,
  onSelectCategory,
  searchValue,
  onChangeSearch,
  placeholder = 'Search crops, mandis, rates...',
  style,
}: MorphingDiscoveryBarProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCat, setSelectedCat] = useState(activeCategoryId || categories[0]?.id || 'all');

  const expandAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (activeCategoryId) {
      setSelectedCat(activeCategoryId);
    }
  }, [activeCategoryId]);

  const handleOpenSearch = () => {
    hapticLight();
    setIsSearching(true);
    Animated.spring(expandAnim, {
      toValue: 1,
      tension: 70,
      friction: 11,
      useNativeDriver: false,
    }).start(() => {
      inputRef.current?.focus();
    });
  };

  const handleCloseSearch = () => {
    hapticLight();
    onChangeSearch('');
    Animated.spring(expandAnim, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start(() => {
      setIsSearching(false);
    });
  };

  const handleCategoryPress = (catId: string) => {
    hapticSelection();
    setSelectedCat(catId);
    onSelectCategory?.(catId);
  };

  // Interpolations for smooth morphing
  const searchInputWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const categoriesOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <View style={[styles.outerWrapper, style]}>
      <View style={styles.barContainer}>
        {/* Expanded Search Input View */}
        {isSearching ? (
          <Animated.View style={[styles.expandedSearchBox, { width: searchInputWidth }]}>
            <MaterialIcons name="search" size={20} color="#145C2E" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={searchValue}
              onChangeText={onChangeSearch}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchValue ? (
              <TouchableOpacity
                onPress={() => {
                  hapticLight();
                  onChangeSearch('');
                }}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="cancel" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleCloseSearch}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={18} color="#4B5563" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Normal Discovery Bar (Search Button + Categories) */
          <View style={styles.idleRow}>
            {/* Search Morph Button */}
            <TouchableOpacity
              style={styles.searchTriggerBtn}
              onPress={handleOpenSearch}
              activeOpacity={0.8}
            >
              <MaterialIcons name="search" size={20} color="#145C2E" />
            </TouchableOpacity>

            {/* Horizontal Categories Row */}
            <Animated.View style={[styles.categoriesWrapper, { opacity: categoriesOpacity }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollTrack}
              >
                {categories.map((cat) => {
                  const isActive = selectedCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                      onPress={() => handleCategoryPress(cat.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons
                        name={cat.icon}
                        size={15}
                        color={isActive ? '#145C2E' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.categoryPillLabel,
                          isActive && styles.categoryPillLabelActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    paddingVertical: 6,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  searchTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  categoriesWrapper: {
    flex: 1,
  },
  categoryScrollTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: '#E8F5E9',
    borderColor: 'rgba(20, 92, 46, 0.25)',
  },
  categoryPillLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  categoryPillLabelActive: {
    fontFamily: FontFamily.bold,
    color: '#145C2E',
  },
  expandedSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.25)',
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginRight: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
