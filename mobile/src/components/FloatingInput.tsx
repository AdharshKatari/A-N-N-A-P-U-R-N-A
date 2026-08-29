import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { BorderRadius, Colors, FontFamily } from '../constants/theme';

interface FloatingInputProps extends TextInputProps {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function FloatingInput({ label, leftIcon, rightIcon, value, style, onFocus, onBlur, ...props }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const raised = focused || Boolean(value);
  useEffect(() => {
    Animated.timing(progress, { toValue: raised ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [raised, progress]);
  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      {Boolean(leftIcon) && <View style={styles.left}>{leftIcon}</View>}
      <Animated.Text pointerEvents="none" style={[styles.label, leftIcon ? styles.labelWithIcon : undefined, {
        top: progress.interpolate({ inputRange: [0, 1], outputRange: [17, -8] }),
        fontSize: progress.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
        color: progress.interpolate({ inputRange: [0, 1], outputRange: [Colors.textMuted, Colors.primaryDeep] }),
      }]}>{label}</Animated.Text>
      <TextInput
        {...props}
        value={value}
        placeholder={focused ? props.placeholder : ''}
        placeholderTextColor={Colors.textPlaceholder}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[styles.input, leftIcon ? styles.inputWithLeft : undefined, rightIcon ? styles.inputWithRight : undefined, style]}
      />
      {rightIcon && <View style={styles.right}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: 56, justifyContent: 'center', borderWidth: 1.25, borderColor: Colors.divider,
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface, position: 'relative' },
  wrapFocused: { borderColor: Colors.primaryDeep },
  input: { minHeight: 54, paddingHorizontal: 15, paddingTop: 14, fontFamily: FontFamily.medium,
    fontSize: 15, color: Colors.textPrimary },
  inputWithLeft: { paddingLeft: 48 },
  inputWithRight: { paddingRight: 48 },
  label: { position: 'absolute', zIndex: 2, left: 14, paddingHorizontal: 4, backgroundColor: Colors.surface,
    fontFamily: FontFamily.medium },
  labelWithIcon: { left: 44 },
  left: { position: 'absolute', left: 15, zIndex: 3 },
  right: { position: 'absolute', right: 13, zIndex: 3 },
});
