import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';

interface MorphingQuestionPopoverProps {
  onSubmit?: (question: string) => void;
}

export default function MorphingQuestionPopover({ onSubmit }: MorphingQuestionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const input = useRef<TextInput>(null);
  useEffect(() => {
    Animated.spring(progress, { toValue: open ? 1 : 0, tension: 210, friction: 22, useNativeDriver: false }).start();
    if (open) setTimeout(() => input.current?.focus(), 160);
  }, [open, progress]);
  const close = () => {
    setQuestion('');
    input.current?.blur();
    setOpen(false);
  };
  const submit = () => {
    const value = question.trim();
    if (!value) return;
    onSubmit?.(value);
    close();
  };
  return (
    <Animated.View style={[styles.container, {
      height: progress.interpolate({ inputRange: [0, 1], outputRange: [42, 190] }),
      borderRadius: progress.interpolate({ inputRange: [0, 1], outputRange: [21, 16] }),
    }]}>
      {!open ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
          <MaterialIcons name="edit-note" size={19} color={Colors.primaryDeep} />
          <Text style={styles.triggerText}>Ask a question</Text>
        </Pressable>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.floatingLabel, question.length > 0 && styles.floatingLabelHidden]}>Ask a question</Text>
          <TextInput ref={input} value={question} onChangeText={setQuestion} multiline
            textAlignVertical="top" maxLength={500} style={styles.input}
            accessibilityLabel="Write your question" />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close question composer"
              onPress={close} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <MaterialIcons name="arrow-back" size={18} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.counter}>{question.length}/500</Text>
            <Pressable accessibilityRole="button" disabled={!question.trim()} onPress={submit}
              style={({ pressed }) => [styles.submitButton, !question.trim() && styles.submitDisabled, pressed && styles.pressed]}>
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface, ...Shadows.button },
  trigger: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  triggerText: { fontFamily: FontFamily.semibold, fontSize: 13, color: Colors.primaryDeep },
  form: { flex: 1, padding: 10 },
  floatingLabel: { position: 'absolute', left: 15, top: 14, zIndex: 2, fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textMuted },
  floatingLabelHidden: { opacity: 0 },
  input: { flex: 1, paddingHorizontal: 5, paddingTop: 3, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19, color: Colors.textPrimary },
  actions: { height: 38, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  counter: { flex: 1, fontFamily: FontFamily.regular, fontSize: 10, color: Colors.textMuted },
  submitButton: { height: 34, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.divider, backgroundColor: Colors.surfaceAlt },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.textSecondary },
  pressed: { opacity: 0.68, transform: [{ scale: 0.98 }] },
});
