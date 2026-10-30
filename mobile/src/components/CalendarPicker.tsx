import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';

interface CalendarPickerProps {
  visible: boolean;
  selectedDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  eyebrow?: string;
  title?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const formatDate = (date: Date) => date.toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

export default function CalendarPicker({
  visible, selectedDate, onConfirm, onCancel, maximumDate, minimumDate,
  eyebrow = 'SELECT DATE', title = 'Choose a date',
}: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));
  const [pickedDate, setPickedDate] = useState(() => startOfDay(selectedDate));

  useEffect(() => {
    if (!visible) return;
    const date = startOfDay(selectedDate);
    setPickedDate(date);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [visible, selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = startOfDay(new Date());
  const cells = useMemo(() => {
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return [...Array.from({ length: leading }, () => null),
      ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [year, month]);

  const isDisabled = (date: Date) => {
    const value = startOfDay(date).getTime();
    return Boolean(
      (minimumDate && value < startOfDay(minimumDate).getTime()) ||
      (maximumDate && value > startOfDay(maximumDate).getTime()),
    );
  };
  const selectToday = () => {
    if (isDisabled(today)) return;
    setPickedDate(today);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <SafeAreaView style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close calendar"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close calendar"
              hitSlop={8}
              onPress={onCancel}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="close" size={21} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.datePreview}>
            <View style={styles.previewIcon}>
              <MaterialIcons name="calendar-month" size={20} color={Colors.textOnPrimary} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewLabel}>Selected date</Text>
              <Text style={styles.previewValue}>{formatDate(pickedDate)}</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
          </View>

          <View style={styles.monthNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="chevron-left" size={24} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="chevron-right" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {DAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
          </View>
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) return <View key={`empty-${index}`} style={styles.daySlot} />;
              const date = new Date(year, month, day);
              const selected = sameDay(date, pickedDate);
              const current = sameDay(date, today);
              const disabled = isDisabled(date);
              return (
                <View key={day} style={styles.daySlot}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={formatDate(date)}
                    accessibilityState={{ selected, disabled }}
                    disabled={disabled}
                    onPress={() => setPickedDate(date)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      current && !selected && styles.today,
                      selected && styles.selectedDay,
                      pressed && !disabled && styles.pressed,
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      current && !selected && styles.todayText,
                      selected && styles.selectedDayText,
                      disabled && styles.disabledText,
                    ]}>{day}</Text>
                    {selected && <View style={styles.selectionMark} />}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={selectToday}
              disabled={isDisabled(today)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Today</Text>
            </Pressable>
            <View style={styles.footerActions}>
              <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onConfirm(pickedDate)}
                style={({ pressed }) => [styles.applyButton, pressed && styles.applyPressed]}
              >
                <Text style={styles.applyText}>Apply</Text>
                <MaterialIcons name="check" size={18} color={Colors.textOnPrimary} />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 28, 20, 0.48)' },
  sheet: { width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: 20, paddingBottom: 18, ...Shadows.modal },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.divider, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  eyebrow: { fontFamily: FontFamily.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.primaryDeep },
  title: { fontFamily: FontFamily.bold, fontSize: 21, color: Colors.textPrimary, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  datePreview: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.divider,
    borderRadius: BorderRadius.md, backgroundColor: Colors.background, padding: 12, marginTop: 5, marginBottom: 10 },
  previewIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.successBg, alignItems: 'center', justifyContent: 'center' },
  previewCopy: { flex: 1, marginLeft: 11 },
  previewLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted },
  previewValue: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary, marginTop: 1 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  navButton: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontFamily: FontFamily.semibold, fontSize: 15, color: Colors.textPrimary },
  weekRow: { flexDirection: 'row', marginTop: 2, marginBottom: 3 },
  weekday: { width: '14.2857%', textAlign: 'center', fontFamily: FontFamily.semibold, fontSize: 11, color: Colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  daySlot: { width: '14.2857%', aspectRatio: 1.1, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: 44, height: 44, maxWidth: '94%', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  today: { backgroundColor: Colors.successBg },
  todayText: { color: Colors.textOnPrimary, fontFamily: FontFamily.bold },
  selectedDay: { backgroundColor: Colors.primaryDeep, ...Shadows.button },
  selectedDayText: { color: Colors.textOnPrimary, fontFamily: FontFamily.bold },
  disabledText: { color: Colors.divider },
  selectionMark: { position: 'absolute', bottom: 5, width: 8, height: 2, borderRadius: 1, backgroundColor: Colors.primaryDeep },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1,
    borderTopColor: Colors.dividerLight, marginTop: 10, paddingTop: 14 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 21, borderWidth: 1, borderColor: Colors.borderGlassStrong },
  secondaryText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.primaryDeep },
  cancelButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 13 },
  cancelText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.textMuted },
  applyButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18,
    borderRadius: 21, backgroundColor: Colors.primaryDeep, ...Shadows.button },
  applyText: { fontFamily: FontFamily.bold, fontSize: 13, color: Colors.textOnPrimary },
  pressed: { opacity: 0.65 },
  applyPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
