/**
 * FloatingVoiceButton — 1-Tap Trigger for Annapurna Vaani Voice Assistant
 *
 * Placed smoothly on screens to allow quick, hands-free multilingual voice assistance.
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { hapticMedium } from '../utils/haptics';
import { Colors, FontFamily, Shadows, ZIndex } from '../constants/theme';

interface FloatingVoiceButtonProps {
  onPress: () => void;
  style?: any;
  label?: string;
}

export default function FloatingVoiceButton({
  onPress,
  style,
  label = 'Ask Vaani',
}: FloatingVoiceButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim, glowAnim]);

  const handlePress = () => {
    hapticMedium();
    onPress();
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open Annapurna Vaani Voice Assistant"
      >
        <View style={styles.iconCircle}>
          <MaterialIcons name="mic" size={22} color="#FFFFFF" />
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 112 : 102,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: ZIndex.sticky,
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#145C2E',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#145C2E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 28,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 48,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
