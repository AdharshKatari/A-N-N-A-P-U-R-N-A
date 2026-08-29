/**
 * MapSearchBar — Address search component with autocomplete
 * Uses Nominatim geocoding to search for places and addresses.
 * Shows a text input with a dropdown of autocomplete results.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { searchAddresses, GeocodingResult, formatShortAddress } from '../services/geocoding';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
} from '../constants/theme';

interface MapSearchBarProps {
  onResultSelect: (result: GeocodingResult) => void;
  placeholder?: string;
  style?: any;
}

export default function MapSearchBar({
  onResultSelect,
  placeholder = 'Search for a place...',
  style,
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await searchAddresses(query, 6);
        setResults(searchResults);
        setShowResults(searchResults.length > 0);
      } catch (error) {
        console.warn('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      setQuery(formatShortAddress(result));
      setShowResults(false);
      setResults([]);
      Keyboard.dismiss();
      onResultSelect(result);
    },
    [onResultSelect],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  }, []);

  const renderResult = useCallback(
    ({ item }: { item: GeocodingResult }) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
      >
        <MaterialIcons name="location-on" size={18} color={Colors.textMuted} />
        <View style={styles.resultTextContainer}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.address?.name || item.address?.road || formatShortAddress(item)}
          </Text>
          <Text style={styles.resultAddress} numberOfLines={1}>
            {item.displayName}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleSelect],
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primaryDark} style={styles.clearIcon} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            bounces={false}
            style={styles.resultsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  searchIcon: {
    // No extra styling needed
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xxs,
  },
  clearButton: {
    padding: Spacing.xxs,
  },
  clearIcon: {
    marginRight: Spacing.xxs,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
    maxHeight: 240,
  },
  resultsList: {
    // No extra styling needed
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerLight,
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resultAddress: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
});
