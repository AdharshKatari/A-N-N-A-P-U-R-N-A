import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

interface ActionAlertProps {
  title: string;
  actionLabel?: string;
  onPress: () => void;
  severity?: 'warning' | 'error';
}

export default function ActionAlert({
  title, actionLabel = 'View', onPress, severity = 'warning',
}: ActionAlertProps) {
  const color = severity === 'error' ? Colors.error : Colors.warning;
  const background = severity === 'error' ? Colors.errorBg : Colors.warningBg;
  return (
    <View accessibilityRole="alert" style={[styles.alert, { backgroundColor: background, borderColor: `${color}55` }]}>
      <View style={[styles.icon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name="error" size={19} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel}: ${title}`}
        onPress={() => { hapticLight(); onPress(); }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderWidth: 1, borderRadius: BorderRadius.md },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, color: Colors.textPrimary },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.62)' },
  buttonText: { fontFamily: FontFamily.bold, fontSize: 12, color: Colors.textSecondary },
  pressed: { opacity: .68, transform: [{ scale: .98 }] },
});
