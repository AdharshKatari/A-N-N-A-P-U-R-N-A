import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

export default function SwitchMode({ width = 92, height = 46 }: { width?: number; height?: number }) {
  const { mode, toggle } = useAppTheme();
  const dark = mode === 'dark';
  const progress = useRef(new Animated.Value(dark ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: dark ? 1 : 0, tension: 180, friction: 18, useNativeDriver: false }).start();
  }, [dark, progress]);
  const knob = height - 4;
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: dark }}
      accessibilityLabel="Dark mode" onPress={toggle}>
      <Animated.View style={[styles.track, { width, height, borderRadius: height / 2,
        backgroundColor: progress.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#171719'] }),
        borderColor: progress.interpolate({ inputRange: [0, 1], outputRange: ['#D8D6E0', '#4C4C50'] }),
      }]}>
        <View style={[styles.icon, { width: height }]}><MaterialIcons name="light-mode" size={height * .42} color={dark ? '#77777D' : '#686771'} /></View>
        <View style={[styles.icon, { width: height }]}><MaterialIcons name="dark-mode" size={height * .42} color={dark ? '#F4F4FB' : '#ABABB4'} /></View>
        <Animated.View style={[styles.knob, { width: knob, height: knob, borderRadius: knob / 2,
          backgroundColor: dark ? '#2A2A2E' : '#F3F2F7',
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [1, width - height + 1] }) }],
        }]} />
      </Animated.View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderWidth: 2, position: 'relative', alignItems: 'center' },
  icon: { height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  knob: { position: 'absolute', left: 0, top: 0, borderWidth: 1, borderColor: 'rgba(120,120,125,.3)' },
});
