/**
 * VoiceAssistantModal — Annapurna Vaani (అన్నపూర్ణ వాణి / अन्नपूर्ణ वाणी)
 *
 * Speech-to-Speech AI Voice Assistant for Indian Farmers.
 * Designed with modern curved pill selector and nested card aesthetic.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, BorderRadius, Shadows } from '../constants/theme';
import { hapticHeavy, hapticLight, hapticMedium } from '../utils/haptics';
import {
  voiceAssistantService,
  SUPPORTED_VOICE_LANGUAGES,
  VoiceLanguage,
  VoiceAssistantResult,
} from '../services/voiceAssistant';

const { width } = Dimensions.get('window');

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
  defaultLanguage?: string;
  context?: { crop?: string; location?: string; latitude?: number; longitude?: number };
}

export default function VoiceAssistantModal({
  visible,
  onClose,
  navigation,
  defaultLanguage = 'te',
  context,
}: VoiceAssistantModalProps) {
  const [selectedLang, setSelectedLang] = useState<string>(defaultLanguage);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [response, setResponse] = useState<VoiceAssistantResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Soundwave and pulsing animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.5)).current;
  const wave3 = useRef(new Animated.Value(0.8)).current;
  const wave4 = useRef(new Animated.Value(0.4)).current;
  const wave5 = useRef(new Animated.Value(0.6)).current;

  // Active language metadata
  const currentLangMeta: VoiceLanguage =
    SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_VOICE_LANGUAGES[0];

  // Animation controllers
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;

    if (isListening || isSpeaking || isProcessing) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: isListening ? 700 : 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: isListening ? 700 : 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(wave1, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(wave1, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, { toValue: 0.9, duration: 400, useNativeDriver: true }),
            Animated.timing(wave2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(wave3, { toValue: 0.2, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave4, { toValue: 0.85, duration: 350, useNativeDriver: true }),
            Animated.timing(wave4, { toValue: 0.35, duration: 350, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(wave5, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(wave5, { toValue: 0.25, duration: 280, useNativeDriver: true }),
          ]),
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim.setValue(1);
      wave1.setValue(0.3);
      wave2.setValue(0.5);
      wave3.setValue(0.8);
      wave4.setValue(0.4);
      wave5.setValue(0.6);
    }

    return () => {
      pulseLoop?.stop();
      waveLoop?.stop();
    };
  }, [isListening, isSpeaking, isProcessing, pulseAnim, wave1, wave2, wave3, wave4, wave5]);

  // Clean up speech on close
  useEffect(() => {
    if (!visible) {
      voiceAssistantService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);
    }
  }, [visible]);

  // Toggle listening
  const toggleListening = async () => {
    if (isListening) {
      hapticMedium();
      setIsListening(false);
      voiceAssistantService.stopSpeechRecognition();
    } else {
      hapticHeavy();
      setErrorMessage(null);
      voiceAssistantService.stopSpeaking();
      setIsSpeaking(false);

      try {
        const started = await voiceAssistantService.startSpeechRecognition(
          selectedLang,
          (text: string, isFinal: boolean) => {
            setTranscript(text);
            if (isFinal) {
              setIsListening(false);
              handleProcessQuery(text);
            }
          },
          (err: string) => {
            setIsListening(false);
            setErrorMessage(err);
          },
          () => {
            setIsListening(false);
          }
        );
        if (started) {
          setIsListening(true);
        } else {
          // If browser/device STT is not active, prompt the user to choose or type
          setIsListening(false);
          setErrorMessage('Tap any question below or type your query:');
        }
      } catch (err: any) {
        setIsListening(false);
        setErrorMessage('Tap any question below or type your query:');
      }
    }
  };

  // Process voice query with backend AI + Inworld + Speech Audio
  const handleProcessQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setTranscript(queryText);

    try {
      const farmerContext = {
        active_crop: context?.crop || 'Tomato',
        location: context?.location || 'Nashik',
        latitude: context?.latitude || 19.9975,
        longitude: context?.longitude || 73.7898,
        active_batches: [
          { crop: 'Tomato', field: 'East Field', weight_kg: 500, quality_score: 82, shelf_life_days: 9 },
        ],
        market_benchmark: { market: 'Pimpalgaon APMC', modal_price: 2800, distance_km: 28 },
      };

      const result = await voiceAssistantService.queryAssistant(
        queryText,
        selectedLang,
        farmerContext
      );

      setResponse(result);
      setIsProcessing(false);

      if (result.spoken_text) {
        setIsSpeaking(true);
        await voiceAssistantService.speak(
          result.spoken_text,
          selectedLang,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Voice assistant could not connect. Please retry.');
    }
  };

  const replayAudio = async () => {
    if (response?.spoken_text) {
      if (isSpeaking) {
        voiceAssistantService.stopSpeaking();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(true);
        await voiceAssistantService.speak(
          response.spoken_text,
          selectedLang,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    }
  };

  const handleExecuteAction = (action?: string) => {
    hapticHeavy();
    onClose();
    if (!action || !navigation) return;

    switch (action) {
      case 'NAVIGATE_MARKET':
        navigation.navigate('Market');
        break;
      case 'NAVIGATE_SCAN':
        navigation.navigate('Scan');
        break;
      case 'NAVIGATE_WEATHER':
        navigation.navigate('Weather');
        break;
      case 'NAVIGATE_SMART_MOVE':
        navigation.navigate('SmartMove');
        break;
      case 'NAVIGATE_CROPS':
        navigation.navigate('AddCrop');
        break;
      default:
        break;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Outer 30px Curved Card Container */}
        <View style={styles.outerCard}>
          {/* Top Header */}
          <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
              <View style={styles.agentIconCircle}>
                <MaterialCommunityIcons name="robot-happy" size={20} color="#145C2E" />
              </View>
              <View>
                <Text style={styles.agentHeading}>Annapurna Vaani</Text>
                <View style={styles.liveStatusRow}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveStatusText}>AI Farm Agent Active</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Language Pill Selector */}
          <View style={styles.langSelectorBox}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langTrack}
            >
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLang;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langCapsule, isSelected && styles.langCapsuleActive]}
                    onPress={() => {
                      hapticLight();
                      setSelectedLang(lang.code);
                      voiceAssistantService.stopSpeaking();
                      setIsSpeaking(false);
                      setResponse(null);
                      setTranscript('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.langFlagText}>{lang.flag}</Text>
                    <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                      {lang.nativeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Inner 28px Nested Card */}
          <View style={styles.innerCard}>
            <ScrollView
              style={styles.innerScroll}
              contentContainerStyle={styles.innerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Dialogue Area */}
              {(transcript || response || isProcessing) ? (
                <View style={styles.dialogueWrapper}>
                  {/* User Query Bubble */}
                  {transcript ? (
                    <View style={styles.userBubble}>
                      <Text style={styles.userBubbleCaption}>You asked:</Text>
                      <Text style={styles.userBubbleQuery}>"{transcript}"</Text>
                    </View>
                  ) : null}

                  {/* Processing Status */}
                  {isProcessing && (
                    <View style={styles.processingBlock}>
                      <ActivityIndicator size="small" color="#145C2E" />
                      <Text style={styles.processingLabel}>Annapurna AI is analyzing farm records...</Text>
                    </View>
                  )}

                  {/* AI Response Card */}
                  {response && !isProcessing && (
                    <View style={styles.aiResponseBox}>
                      <View style={styles.aiHeaderRow}>
                        <View style={styles.aiTagBadge}>
                          <MaterialCommunityIcons name={"creation" as any} size={15} color="#145C2E" />
                          <Text style={styles.aiTagText}>Agent Answer</Text>
                        </View>
                        <TouchableOpacity style={styles.audioSpeakerBtn} onPress={replayAudio} activeOpacity={0.7}>
                          <MaterialIcons
                            name={isSpeaking ? 'volume-up' : 'volume-mute'}
                            size={18}
                            color="#145C2E"
                          />
                          <Text style={styles.audioSpeakerText}>{isSpeaking ? 'Playing' : 'Listen'}</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Regional Response */}
                      <Text style={styles.aiSpokenBody}>{response.spoken_text}</Text>

                      {/* English Translation */}
                      {response.english_translation && selectedLang !== 'en' && (
                        <Text style={styles.aiTransBody}>{response.english_translation}</Text>
                      )}

                      {/* Action Button */}
                      {response.action && (
                        <TouchableOpacity
                          style={styles.actionShortcutBtn}
                          onPress={() => handleExecuteAction(response.action)}
                          activeOpacity={0.85}
                        >
                          <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
                          <Text style={styles.actionShortcutBtnText}>
                            {response.action_label || 'Proceed'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                /* Idle Prompt Chips */
                <View style={styles.suggestionsWrapper}>
                  <Text style={styles.suggestionsHeading}>
                    {selectedLang === 'te' ? 'ఈ ప్రశ్నలను అడగండి:' :
                     selectedLang === 'hi' ? 'आप ये सवाल पूछ सकते हैं:' :
                     'Tap to ask quick questions:'}
                  </Text>
                  <View style={styles.promptsGrid}>
                    {currentLangMeta.samplePrompts.map((prompt, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.promptButton}
                        onPress={() => {
                          hapticLight();
                          setTranscript(prompt);
                          handleProcessQuery(prompt);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="chat-question-outline" size={15} color="#145C2E" />
                        <Text style={styles.promptButtonText}>{prompt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorCard}>
                  <MaterialIcons name="info-outline" size={16} color="#C62828" />
                  <Text style={styles.errorCardText}>{errorMessage}</Text>
                </View>
              )}
            </ScrollView>

            {/* Direct Query Input Bar */}
            <View style={styles.inputBarRow}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  selectedLang === 'te' ? 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...' :
                  selectedLang === 'hi' ? 'यहाँ अपना प्रश्न टाइप करें...' :
                  selectedLang === 'mr' ? 'येथे प्रश्न टाइप करा...' :
                  'Type your question here...'
                }
                placeholderTextColor="#9CA3AF"
                value={customQuery}
                onChangeText={setCustomQuery}
                onSubmitEditing={() => {
                  if (customQuery.trim()) {
                    handleProcessQuery(customQuery);
                    setCustomQuery('');
                  }
                }}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !customQuery.trim() && styles.sendBtnDisabled]}
                onPress={() => {
                  if (customQuery.trim()) {
                    hapticLight();
                    handleProcessQuery(customQuery);
                    setCustomQuery('');
                  }
                }}
                disabled={!customQuery.trim()}
              >
                <MaterialIcons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Wave & Mic Action Bar */}
          <View style={styles.bottomBar}>
            {/* Audio Wave Bars */}
            <View style={styles.soundWaveRow}>
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave1 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave2 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave3 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave4 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave5 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave2 }] }]} />
              <Animated.View style={[styles.soundWaveBar, { transform: [{ scaleY: wave1 }] }]} />
            </View>

            {/* Mic Center Trigger */}
            <View style={styles.micCircleWrap}>
              <Animated.View
                style={[
                  styles.micBreathingRing,
                  isListening && styles.micBreathingListening,
                  isSpeaking && styles.micBreathingSpeaking,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.micActionButton,
                  isListening && styles.micButtonActiveListening,
                  isSpeaking && styles.micButtonActiveSpeaking,
                ]}
                onPress={toggleListening}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={isListening ? 'mic' : isSpeaking ? 'volume-up' : 'mic-none'}
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Status Line */}
            <Text style={styles.bottomStatusText}>
              {isListening
                ? selectedLang === 'te' ? 'మీ మాటలు వింటున్నాను...' : selectedLang === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'
                : isSpeaking
                ? selectedLang === 'te' ? 'సమాధానం చెబుతున్నాను...' : selectedLang === 'hi' ? 'उत्तर दे रहा हूँ...' : 'Annapurna Vaani is speaking...'
                : selectedLang === 'te' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : selectedLang === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap microphone to speak'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 10, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  outerCard: {
    width: '100%',
    maxWidth: 375,
    backgroundColor: '#F6F5FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    padding: 16,
    ...Shadows.modal,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  agentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  liveStatusText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#2E7D32',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSelectorBox: {
    marginBottom: 12,
  },
  langTrack: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  langCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  langCapsuleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  langFlagText: {
    fontSize: 13,
  },
  langLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  langLabelActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  innerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    height: 240,
    overflow: 'hidden',
  },
  innerScroll: {
    flex: 1,
  },
  innerScrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  dialogueWrapper: {
    gap: 10,
  },
  userBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 10,
  },
  userBubbleCaption: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  userBubbleQuery: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  processingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  processingLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#145C2E',
  },
  aiResponseBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.12)',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#145C2E',
  },
  audioSpeakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  audioSpeakerText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#145C2E',
  },
  aiSpokenBody: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#111827',
    lineHeight: 19,
    marginBottom: 4,
  },
  aiTransBody: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actionShortcutBtn: {
    backgroundColor: '#145C2E',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  actionShortcutBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  suggestionsWrapper: {
    gap: 8,
  },
  suggestionsHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
  },
  promptsGrid: {
    gap: 6,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  promptButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  errorCardText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#C62828',
    flex: 1,
  },
  bottomBar: {
    alignItems: 'center',
    paddingTop: 12,
  },
  soundWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 18,
    marginBottom: 6,
  },
  soundWaveBar: {
    width: 3,
    height: 16,
    backgroundColor: '#145C2E',
    borderRadius: 1.5,
  },
  micCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  micBreathingRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(20, 92, 46, 0.15)',
  },
  micBreathingListening: {
    backgroundColor: 'rgba(198, 40, 40, 0.2)',
  },
  micBreathingSpeaking: {
    backgroundColor: 'rgba(20, 92, 46, 0.25)',
  },
  micActionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  micButtonActiveListening: {
    backgroundColor: '#C62828',
  },
  micButtonActiveSpeaking: {
    backgroundColor: '#2E7D32',
  },
  bottomStatusText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
