import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Colors, Spacing, BorderRadius, Typography, FontFamily } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

interface KisanVoiceSpeakerProps {
  textToSpeak: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outline' | 'glass';
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function KisanVoiceSpeaker({
  textToSpeak,
  label,
  size = 'medium',
  variant = 'filled',
  onSpeechStart,
  onSpeechEnd,
}: KisanVoiceSpeakerProps) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Map app language code to TTS language tag
  const getLanguageTag = (lang: string) => {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'te': return 'te-IN';
      case 'ta': return 'ta-IN';
      case 'kn': return 'kn-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  };

  const handleToggleSpeak = useCallback(async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking || isSpeaking) {
        await Speech.stop();
        setIsSpeaking(false);
        onSpeechEnd?.();
        return;
      }

      if (!textToSpeak || textToSpeak.trim() === '') return;

      setIsSpeaking(true);
      onSpeechStart?.();

      const langTag = getLanguageTag(language);

      Speech.speak(textToSpeak, {
        language: langTag,
        rate: 0.92, // slightly slower for rural clarity
        pitch: 1.0,
        onDone: () => {
          setIsSpeaking(false);
          onSpeechEnd?.();
        },
        onError: (err) => {
          console.warn('[KisanVoiceSpeaker] Speech error:', err);
          setIsSpeaking(false);
          onSpeechEnd?.();
        },
        onStopped: () => {
          setIsSpeaking(false);
          onSpeechEnd?.();
        },
      });
    } catch (e) {
      console.warn('[KisanVoiceSpeaker] Error toggling TTS:', e);
      setIsSpeaking(false);
    }
  }, [textToSpeak, isSpeaking, language, onSpeechStart, onSpeechEnd]);

  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const isSmall = size === 'small';
  const isLarge = size === 'large';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleToggleSpeak}
      style={[
        styles.container,
        variant === 'filled' && (isSpeaking ? styles.containerActive : styles.containerFilled),
        variant === 'outline' && styles.containerOutline,
        variant === 'glass' && styles.containerGlass,
        isSmall && styles.containerSmall,
        isLarge && styles.containerLarge,
      ]}
      accessibilityLabel={isSpeaking ? "Stop voice guidance" : "Play voice guidance"}
      accessibilityRole="button"
    >
      <MaterialIcons
        name={isSpeaking ? "volume-up" : "volume-mute"}
        size={isSmall ? 16 : isLarge ? 24 : 20}
        color={isSpeaking ? "#FFFFFF" : variant === 'filled' ? Colors.primaryDeep : Colors.textPrimary}
      />
      {label && (
        <Text
          style={[
            styles.labelText,
            isSmall && styles.labelSmall,
            isLarge && styles.labelLarge,
            { color: isSpeaking ? "#FFFFFF" : variant === 'filled' ? Colors.primaryDeep : Colors.textPrimary }
          ]}
          numberOfLines={1}
        >
          {isSpeaking ? "Speaking..." : label}
        </Text>
      )}
      {isSpeaking && (
        <View style={styles.pulseDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full || 999,
    gap: Spacing.xs,
  },
  containerFilled: {
    backgroundColor: 'rgba(107, 163, 90, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 163, 90, 0.3)',
  },
  containerActive: {
    backgroundColor: Colors.primaryDeep,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  containerOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  containerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(107, 163, 90, 0.2)',
  },
  containerSmall: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
  },
  containerLarge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  labelText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 15,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginLeft: 2,
  },
});
