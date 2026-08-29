import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../constants/theme';

export default function Clock() {
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    };
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.clock} accessible accessibilityRole="timer" accessibilityLabel={timeStr}>
      <Text style={styles.digit}>{timeStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  digit: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
