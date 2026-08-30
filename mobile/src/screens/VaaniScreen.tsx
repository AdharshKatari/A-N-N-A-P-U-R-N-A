import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  SafeAreaView,
  StatusBar,
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
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function VaaniScreen({ navigation }: any) {
  const { language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<string>(
    ['te', 'hi', 'mr', 'en'].includes(language) ? language : 'te'
  );
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [response, setResponse] = useState<VoiceAssistantResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Soundwave pulsing animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.5)).current;
  const wave3 = useRef(new Animated.Value(0.8)).current;
  const wave4 = useRef(new Animated.Value(0.4)).current;
  const wave5 = useRef(new Animated.Value(0.6)).current;

  const currentLangMeta: VoiceLanguage =
    SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_VOICE_LANGUAGES[0];

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
          setIsListening(false);
          setErrorMessage(
            selectedLang === 'te'
              ? 'కింది ప్రశ్నలలో ఒకదాన్ని నొక్కండి లేదా మీ ప్రశ్నను టైప్ చేయండి:'
              : selectedLang === 'hi'
              ? 'नीचे दिए गए किसी भी प्रश्न पर टैप करें या अपना प्रश्न टाइप करें:'
              : 'Tap any prompt below or type your question:'
          );
        }
      } catch (err: any) {
        setIsListening(false);
      }
    }
  };

  const handleProcessQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setTranscript(queryText);

    try {
      const farmerContext = {
        active_crop: 'Tomato',
        location: 'Nashik',
        latitude: 19.9975,
        longitude: 73.7898,
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
      setErrorMessage(
        selectedLang === 'te'
          ? 'సమాధానం పొందడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
          : 'Failed to process request. Please try again.'
      );
    }
  };

  const replayAudio = async () => {
    if (!response?.spoken_text) return;
    hapticLight();
    if (isSpeaking) {
      await voiceAssistantService.stopSpeaking();
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
  };

  const handleExecuteAction = (action?: string) => {
    if (!action) return;
    hapticMedium();
    switch (action) {
      case 'NAVIGATE_MARKET':
        navigation?.navigate('Market');
        break;
      case 'NAVIGATE_SCAN':
        navigation?.navigate('Scan');
        break;
      case 'NAVIGATE_WEATHER':
        navigation?.navigate('Weather');
        break;
      case 'NAVIGATE_SMART_MOVE':
        navigation?.navigate('SmartMove', { crop: 'Tomatoes', field: 'East Field' });
        break;
      case 'NAVIGATE_CROPS':
        navigation?.navigate('CropBatches');
        break;
      default:
        navigation?.navigate('SmartMove');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F5" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <MaterialIcons name="record-voice-over" size={22} color="#145C2E" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Annapurna Vaani</Text>
            <Text style={styles.headerSubtitle}>అన్నపూర్ణ వాణి • AI Voice Assistant</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.liveBadgeText}>ONLINE</Text>
        </View>
      </View>

      {/* Language Selector Pills */}
      <View style={styles.langPillContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPillScroll}>
          {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langPill, isSelected && styles.langPillActive]}
                onPress={() => {
                  hapticLight();
                  setSelectedLang(lang.code);
                  setResponse(null);
                  setErrorMessage(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langText, isSelected && styles.langTextActive]}>
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Central Mic Visualizer Hero */}
        <View style={styles.micHeroSection}>
          <Animated.View
            style={[
              styles.micPulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: isListening || isSpeaking ? 0.35 : 0.08,
                backgroundColor: isListening ? '#E53935' : '#145C2E',
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.micMainButton,
              isListening && styles.micMainButtonListening,
              isSpeaking && styles.micMainButtonSpeaking,
            ]}
            onPress={toggleListening}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={isListening ? 'mic' : isSpeaking ? 'volume-up' : isProcessing ? 'hourglass-empty' : 'mic-none'}
              size={42}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.micStatusLabel}>
            {isListening
              ? selectedLang === 'te' ? 'వినబడుతోంది... మాట్లాడండి' : selectedLang === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... Speak now'
              : isProcessing
              ? 'Analyzing with AI...'
              : isSpeaking
              ? selectedLang === 'te' ? 'సమాధానం చెబుతోంది...' : 'Speaking...'
              : selectedLang === 'te' ? 'మాట్లాడటానికి మైక్ నొక్కండి' : selectedLang === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap mic to ask anything'}
          </Text>

          {/* Dynamic Audio Waves */}
          <View style={styles.waveRow}>
            <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave1 }] }]} />
            <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave2 }] }]} />
            <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave3 }] }]} />
            <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave4 }] }]} />
            <Animated.View style={[styles.waveBar, { transform: [{ scaleY: wave5 }] }]} />
          </View>
        </View>

        {/* Live Conversation & Response Box */}
        {(!!transcript || !!response) ? (
          <View style={styles.convoSection}>
            {!!transcript ? (
              <View style={styles.userSpeechCard}>
                <Text style={styles.userSpeechTag}>Your Query / మీ ప్రశ్న</Text>
                <Text style={styles.userSpeechText}>"{transcript}"</Text>
              </View>
            ) : null}

            {response && !isProcessing ? (
              <View style={styles.aiResponseBox}>
                <View style={styles.aiHeaderRow}>
                  <View style={styles.aiTagBadge}>
                    <MaterialCommunityIcons name={"creation" as any} size={15} color="#145C2E" />
                    <Text style={styles.aiTagText}>Annapurna AI Answer</Text>
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

                <Text style={styles.aiSpokenBody}>{response.spoken_text}</Text>

                {!!response.english_translation && selectedLang !== 'en' ? (
                  <Text style={styles.aiTransBody}>{response.english_translation}</Text>
                ) : null}

                {!!response.action ? (
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
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          /* Suggested Quick Prompts */
          <View style={styles.suggestionsWrapper}>
            <Text style={styles.suggestionsHeading}>
              {selectedLang === 'te' ? 'త్వరిత ప్రశ్నలు (Tap any question):' :
               selectedLang === 'hi' ? 'तुरंत पूछने के लिए टैप करें:' :
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
                  <MaterialCommunityIcons name="chat-question-outline" size={16} color="#145C2E" />
                  <Text style={styles.promptButtonText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!!errorMessage ? (
          <View style={styles.errorCard}>
            <MaterialIcons name="info-outline" size={16} color="#C62828" />
            <Text style={styles.errorCardText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Manual Query Input Bar */}
      <View style={styles.inputBarRow}>
        <TextInput
          style={styles.textInput}
          placeholder={
            selectedLang === 'te' ? 'మీ ప్రశ్నను టైప్ చేయండి...' :
            selectedLang === 'hi' ? 'यहाँ प्रश्न टाइप करें...' :
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
        />
        <TouchableOpacity
          style={[styles.sendButton, !customQuery.trim() && styles.sendButtonDisabled]}
          disabled={!customQuery.trim()}
          onPress={() => {
            if (customQuery.trim()) {
              handleProcessQuery(customQuery);
              setCustomQuery('');
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#145C2E',
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#145C2E',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#145C2E',
    letterSpacing: 0.5,
  },
  langPillContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  langPillScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  langPillActive: {
    backgroundColor: '#145C2E',
  },
  langFlag: {
    fontSize: 14,
  },
  langText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  micHeroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  micPulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  micMainButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  micMainButtonListening: {
    backgroundColor: '#E53935',
  },
  micMainButtonSpeaking: {
    backgroundColor: '#059669',
  },
  micStatusLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    height: 24,
  },
  waveBar: {
    width: 4,
    height: 20,
    backgroundColor: '#145C2E',
    borderRadius: 2,
  },
  convoSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  userSpeechCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userSpeechTag: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  userSpeechText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
    color: '#1F2937',
    fontStyle: 'italic',
  },
  aiResponseBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#145C2E',
    ...Shadows.card,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#145C2E',
  },
  audioSpeakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  audioSpeakerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#145C2E',
  },
  aiSpokenBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
    color: '#111827',
  },
  aiTransBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  actionShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145C2E',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  actionShortcutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  suggestionsWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  suggestionsHeading: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  promptsGrid: {
    gap: 8,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  promptButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorCardText: {
    fontSize: 12,
    color: '#C62828',
    flex: 1,
    fontWeight: '500',
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAF8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
