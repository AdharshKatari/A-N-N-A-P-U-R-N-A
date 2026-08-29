import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';

interface DynamicToolbarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onProfilePress?: () => void;
}

export default function DynamicToolbar({
  value, onChangeText, placeholder = 'Search', onProfilePress,
}: DynamicToolbarProps) {
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const input = useRef<TextInput>(null);
  useEffect(() => {
    Animated.spring(progress, { toValue: open ? 1 : 0, tension: 240, friction: 22, useNativeDriver: false }).start();
    if (open) setTimeout(() => input.current?.focus(), 120);
  }, [open, progress]);
  const close = () => {
    input.current?.blur();
    setOpen(false);
  };
  return (
    <Animated.View style={[styles.shell, {
      width: progress.interpolate({ inputRange: [0, 1], outputRange: [98, 300] }),
    }]}>
      {!open ? (
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" disabled={!onProfilePress}
            onPress={onProfilePress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <MaterialIcons name="person-outline" size={21} color={Colors.textMuted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={placeholder} onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <MaterialIcons name="search" size={21} color={Colors.textSecondary} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close search" onPress={close}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <MaterialIcons name="arrow-back" size={21} color={Colors.textSecondary} />
          </Pressable>
          <TextInput ref={input} value={value} onChangeText={onChangeText} placeholder={placeholder}
            placeholderTextColor={Colors.textMuted} returnKeyType="search" style={styles.input} />
          {value.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')}
              style={styles.clearButton}>
              <MaterialIcons name="close" size={17} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { height: 50, alignSelf: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface, padding: 6, ...Shadows.button },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  button: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  pressed: { backgroundColor: Colors.surfaceAlt, transform: [{ scale: 0.98 }] },
  input: { flex: 1, minWidth: 0, height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.divider,
    borderRadius: 10, fontFamily: FontFamily.medium, fontSize: 13, color: Colors.textPrimary },
  clearButton: { position: 'absolute', right: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
