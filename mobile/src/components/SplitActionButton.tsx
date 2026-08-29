import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

interface SplitActionButtonProps {
  label: string;
  onPress: () => void;
  externalUrl: string;
  externalLabel?: string;
}

export default function SplitActionButton({
  label, onPress, externalUrl, externalLabel = 'Open external source',
}: SplitActionButtonProps) {
  const openExternal = async () => {
    hapticLight();
    try {
      if (!(await Linking.canOpenURL(externalUrl))) throw new Error('Unsupported URL');
      await Linking.openURL(externalUrl);
    } catch {
      Alert.alert('Unable to open source', 'Please try again when a browser is available.');
    }
  };
  return (
    <View style={styles.group}>
      <Pressable accessibilityRole="button" onPress={() => { hapticLight(); onPress(); }}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
        <Text numberOfLines={1} style={styles.label}>{label}</Text>
      </Pressable>
      <View style={styles.divider} />
      <Pressable accessibilityRole="link" accessibilityLabel={externalLabel} onPress={openExternal}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <MaterialIcons name="north-east" size={19} color={Colors.textOnPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 46,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDeep,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  primary: {
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: Colors.textOnPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  iconButton: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
