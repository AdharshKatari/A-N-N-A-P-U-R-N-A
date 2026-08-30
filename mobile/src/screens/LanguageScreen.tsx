import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage, LANGUAGE_OPTIONS } from '../constants/translations';
import { voiceAssistantService } from '../services/voiceAssistant';
import VoiceAssistantModal from '../components/VoiceAssistantModal';
import { hapticLight, hapticSuccess } from '../utils/haptics';

const { width } = Dimensions.get('window');

export default function LanguageScreen({ navigation, route }: any) {
  const { language, setLanguage, completeLanguageSelection, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<SupportedLanguage | null>(null);

  // Toggle states for preferences
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [cropHealthAlerts, setCropHealthAlerts] = useState(true);
  const [smartMoveReminders, setSmartMoveReminders] = useState(true);
  const [marketPriceAlerts, setMarketPriceAlerts] = useState(true);

  const isFromSettings = route?.params?.fromSettings || navigation.canGoBack();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    hapticLight();
    setSelectedLanguage(code);
    setLanguage(code);

    // Audio preview of the selected language
    const meta = LANGUAGE_OPTIONS.find((l) => l.code === code);
    if (meta?.greeting) {
      setIsPlayingAudio(code);
      voiceAssistantService.speak(
        meta.greeting,
        code,
        () => setIsPlayingAudio(code),
        () => setIsPlayingAudio(null)
      );
    }
  };

  const handleContinue = async () => {
    hapticSuccess();
    await completeLanguageSelection(selectedLanguage);

    if (navigation.canGoBack() && isFromSettings) {
      navigation.goBack();
    } else {
      // After language is selected → go to Login (voice-assisted sign in/up)
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8F3" />

      {/* Top Header */}
      <View style={styles.header}>
        {isFromSettings ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#145C2E" />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandIconCircle}>
            <MaterialCommunityIcons name="sprout" size={24} color="#145C2E" />
          </View>
        )}

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>
            {selectedLanguage === 'te' ? 'భాషను ఎంచుకోండి' :
             selectedLanguage === 'hi' ? 'भाषा का चयन करें' :
             selectedLanguage === 'mr' ? 'भाषा निवडा' :
             'Select Language'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedLanguage === 'te' ? 'మీకు సులభమైన భాషలో యాప్ ఉపయోగించండి' :
             selectedLanguage === 'hi' ? 'अपनी सुविधानुसार पसंदीदा भाषा चुनें' :
             selectedLanguage === 'mr' ? 'आपल्या पसंतीच्या भाषेत ॲप वापरा' :
             'Choose your preferred language for the entire app'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Annapurna Vaani Voice Assistant Banner */}
        <TouchableOpacity
          style={styles.vaaniCard}
          onPress={() => setVoiceModalVisible(true)}
          activeOpacity={0.88}
        >
          <View style={styles.vaaniCardHeader}>
            <View style={styles.vaaniAvatar}>
              <MaterialCommunityIcons name="robot-happy" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.vaaniTextCol}>
              <View style={styles.vaaniBadgeRow}>
                <Text style={styles.vaaniCardTitle}>{t('vaani_title')}</Text>
                <View style={styles.liveAiBadge}>
                  <Text style={styles.liveAiBadgeText}>AI Voice</Text>
                </View>
              </View>
              <Text style={styles.vaaniCardDesc}>
                {selectedLanguage === 'te' ? 'తెలుగులో ప్రశ్నలు అడగండి — మైక్ నొక్కండి' :
                 selectedLanguage === 'hi' ? 'हिन्दी में बोलकर सवाल पूछें — माइक दबाएं' :
                 selectedLanguage === 'mr' ? 'मराठीत बोलून माहिती मिळवा' :
                 'Speak in your native language with AI farm assistant'}
              </Text>
            </View>
          </View>

          <View style={styles.vaaniStartBtn}>
            <MaterialIcons name="mic" size={18} color="#145C2E" />
            <Text style={styles.vaaniStartBtnText}>{t('vaani_speak')}</Text>
          </View>
        </TouchableOpacity>

        {/* Language Selection Grid */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="translate" size={20} color="#145C2E" />
            <Text style={styles.sectionHeading}>{t('select_language')}</Text>
          </View>
          <Text style={styles.sectionSubHeading}>{t('select_language_sub')}</Text>

          <View style={styles.languagesList}>
            {LANGUAGE_OPTIONS.map((langOpt) => {
              const isSelected = selectedLanguage === langOpt.code;
              const isSpeakingThis = isPlayingAudio === langOpt.code;

              return (
                <TouchableOpacity
                  key={langOpt.code}
                  style={[
                    styles.languageCard,
                    isSelected && styles.languageCardSelected,
                  ]}
                  onPress={() => handleSelectLanguage(langOpt.code)}
                  activeOpacity={0.85}
                >
                  <View style={styles.languageCardLeft}>
                    <View
                      style={[
                        styles.flagCircle,
                        isSelected && styles.flagCircleSelected,
                      ]}
                    >
                      <Text style={styles.flagEmoji}>{langOpt.flag}</Text>
                    </View>

                    <View style={styles.langTextGroup}>
                      <View style={styles.langNameRow}>
                        <Text
                          style={[
                            styles.langNativeName,
                            isSelected && styles.langNativeNameSelected,
                          ]}
                        >
                          {langOpt.nativeName}
                        </Text>
                        <Text style={styles.langEnglishName}>({langOpt.name})</Text>
                      </View>
                      <Text style={styles.langSubtext}>{langOpt.greeting}</Text>
                    </View>
                  </View>

                  <View style={styles.languageCardRight}>
                    {isSpeakingThis ? (
                      <View style={styles.audioWavePill}>
                        <MaterialCommunityIcons name="volume-high" size={18} color="#145C2E" />
                      </View>
                    ) : isSelected ? (
                      <View style={styles.radioSelected}>
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App Notification Preferences */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="notifications-active" size={20} color="#145C2E" />
            <Text style={styles.sectionHeading}>
              {selectedLanguage === 'te' ? 'నోటిఫికేషన్ సెట్టింగ్‌లు' :
               selectedLanguage === 'hi' ? 'सूचना प्राथमिकताएं' :
               selectedLanguage === 'mr' ? 'सूचना सेटिंग्ज' :
               'Notification Alerts'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                {selectedLanguage === 'te' ? 'వాతావరణ హెచ్చరికలు' :
                 selectedLanguage === 'hi' ? 'मौसम व बारिश अलर्ट' :
                 selectedLanguage === 'mr' ? 'हवामान सूचना' :
                 'Weather & Rain Alerts'}
              </Text>
              <Text style={styles.toggleDesc}>
                {selectedLanguage === 'te' ? 'వర్షం మరియు పంట కోత అనుకూల సమాచారం' :
                 'Real-time rainfall & harvest viability warnings'}
              </Text>
            </View>
            <Switch
              value={weatherAlerts}
              onValueChange={setWeatherAlerts}
              trackColor={{ false: '#E2E8F0', true: '#C8E6C9' }}
              thumbColor={weatherAlerts ? '#145C2E' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>
                {selectedLanguage === 'te' ? 'మార్కెట్ ధర హెచ్చరికలు' :
                 selectedLanguage === 'hi' ? 'मंडी भाव तेजी अलर्ट' :
                 selectedLanguage === 'mr' ? 'बाजार भाव सूचना' :
                 'Live Mandi Price Spikes'}
              </Text>
              <Text style={styles.toggleDesc}>
                {selectedLanguage === 'te' ? 'సమీప APMCలలో ధర పెరిగినప్పుడు నోటిఫికేషన్' :
                 'Instant alerts when terminal markets offer arbitrage gains'}
              </Text>
            </View>
            <Switch
              value={marketPriceAlerts}
              onValueChange={setMarketPriceAlerts}
              trackColor={{ false: '#E2E8F0', true: '#C8E6C9' }}
              thumbColor={marketPriceAlerts ? '#145C2E' : '#94A3B8'}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.88}
        >
          <Text style={styles.continueButtonText}>
            {selectedLanguage === 'te' ? 'ముందుకు సాగండి' :
             selectedLanguage === 'hi' ? 'आगे बढ़ें (Continue)' :
             selectedLanguage === 'mr' ? 'पुढे चला (Continue)' :
             'Continue to Farm Dashboard'}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Floating Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFE9',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  brandIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F3E1E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#55725E',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  scrollContent: {
    padding: 16,
  },
  vaaniCard: {
    backgroundColor: '#0F3E1E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F3E1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  vaaniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vaaniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaaniTextCol: {
    flex: 1,
  },
  vaaniBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaaniCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  liveAiBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  liveAiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  vaaniCardDesc: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 4,
    lineHeight: 16,
  },
  vaaniStartBtn: {
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  vaaniStartBtnText: {
    color: '#145C2E',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F3E1E',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  languagesList: {
    gap: 10,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  languageCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#145C2E',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  languageCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  flagCircleSelected: {
    borderColor: '#145C2E',
    backgroundColor: '#FFFFFF',
  },
  flagEmoji: {
    fontSize: 20,
  },
  langTextGroup: {
    flex: 1,
  },
  langNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langNativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  langNativeNameSelected: {
    color: '#0F3E1E',
    fontWeight: '800',
  },
  langEnglishName: {
    fontSize: 12,
    color: '#64748B',
  },
  langSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  languageCardRight: {
    marginLeft: 10,
  },
  radioSelected: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#145C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  audioWavePill: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: '#145C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
