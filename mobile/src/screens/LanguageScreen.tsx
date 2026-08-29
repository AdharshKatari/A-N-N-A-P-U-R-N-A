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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import VoiceAssistantModal from '../components/VoiceAssistantModal';

export default function LanguageScreen({ navigation }: any) {
  const [selectedLanguage, setSelectedLanguage] = useState<'te' | 'hi' | 'en' | 'mr'>('te');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // Toggle states
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [cropHealthAlerts, setCropHealthAlerts] = useState(true);
  const [smartMoveReminders, setSmartMoveReminders] = useState(true);
  const [marketPriceAlerts, setMarketPriceAlerts] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={22} color="#00431D" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSubtitle}>
          Manage language, voice assistant, and app preferences
        </Text>

        {/* Section 0: Annapurna Vaani Voice Assistant */}
        <TouchableOpacity
          style={styles.vaaniCard}
          onPress={() => setVoiceModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.vaaniCardHeader}>
            <View style={styles.vaaniAvatar}>
              <MaterialCommunityIcons name="robot-happy" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.vaaniTextCol}>
              <Text style={styles.vaaniCardTitle}>Annapurna Vaani (స్వర సహాయకి)</Text>
              <Text style={styles.vaaniCardDesc}>
                Talk with your AI farming voice assistant in Telugu, Hindi, English, or Marathi
              </Text>
            </View>
          </View>
          <View style={styles.vaaniStartBtn}>
            <MaterialIcons name="mic" size={20} color="#145C2E" />
            <Text style={styles.vaaniStartBtnText}>Launch Voice Assistant</Text>
          </View>
        </TouchableOpacity>

        {/* Section 1: Language */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Language</Text>

          {/* Telugu */}
          <TouchableOpacity
            style={[
              styles.languageRow,
              selectedLanguage === 'te' && styles.languageRowSelected,
            ]}
            onPress={() => setSelectedLanguage('te')}
            activeOpacity={0.85}
          >
            <View style={styles.languageRowLeft}>
              <MaterialIcons
                name="language"
                size={22}
                color={selectedLanguage === 'te' ? '#145C2E' : '#404940'}
              />
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === 'te' && styles.languageNameSelected,
                ]}
              >
                తెలుగు (Telugu)
              </Text>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLanguage === 'te' && styles.radioCircleSelected,
              ]}
            >
              {selectedLanguage === 'te' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* Hindi */}
          <TouchableOpacity
            style={[
              styles.languageRow,
              selectedLanguage === 'hi' && styles.languageRowSelected,
            ]}
            onPress={() => setSelectedLanguage('hi')}
            activeOpacity={0.85}
          >
            <View style={styles.languageRowLeft}>
              <MaterialIcons
                name="language"
                size={22}
                color={selectedLanguage === 'hi' ? '#145C2E' : '#404940'}
              />
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === 'hi' && styles.languageNameSelected,
                ]}
              >
                हिन्दी (Hindi)
              </Text>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLanguage === 'hi' && styles.radioCircleSelected,
              ]}
            >
              {selectedLanguage === 'hi' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* Marathi */}
          <TouchableOpacity
            style={[
              styles.languageRow,
              selectedLanguage === 'mr' && styles.languageRowSelected,
            ]}
            onPress={() => setSelectedLanguage('mr')}
            activeOpacity={0.85}
          >
            <View style={styles.languageRowLeft}>
              <MaterialIcons
                name="language"
                size={22}
                color={selectedLanguage === 'mr' ? '#145C2E' : '#404940'}
              />
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === 'mr' && styles.languageNameSelected,
                ]}
              >
                मराठी (Marathi)
              </Text>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLanguage === 'mr' && styles.radioCircleSelected,
              ]}
            >
              {selectedLanguage === 'mr' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* English */}
          <TouchableOpacity
            style={[
              styles.languageRow,
              selectedLanguage === 'en' && styles.languageRowSelected,
            ]}
            onPress={() => setSelectedLanguage('en')}
            activeOpacity={0.85}
          >
            <View style={styles.languageRowLeft}>
              <MaterialIcons
                name="language"
                size={22}
                color={selectedLanguage === 'en' ? '#145C2E' : '#404940'}
              />
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === 'en' && styles.languageNameSelected,
                ]}
              >
                English
              </Text>
            </View>

            <View
              style={[
                styles.radioCircle,
                selectedLanguage === 'en' && styles.radioCircleSelected,
              ]}
            >
              {selectedLanguage === 'en' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Alerts & Notifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Alerts & Notifications</Text>

          {/* Toggle 1: Weather Alerts */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Weather Alerts</Text>
              <Text style={styles.toggleSubtitle}>Get alerts for rain or storms</Text>
            </View>
            <Switch
              value={weatherAlerts}
              onValueChange={setWeatherAlerts}
              trackColor={{ false: '#ECE8DF', true: '#145C2E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Toggle 2: Crop Health Alerts */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Crop Health Alerts</Text>
              <Text style={styles.toggleSubtitle}>Notifications from pest scans</Text>
            </View>
            <Switch
              value={cropHealthAlerts}
              onValueChange={setCropHealthAlerts}
              trackColor={{ false: '#ECE8DF', true: '#145C2E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Toggle 3: Smart Move Reminders */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Smart Move Reminders</Text>
              <Text style={styles.toggleSubtitle}>Updates on transport tracking</Text>
            </View>
            <Switch
              value={smartMoveReminders}
              onValueChange={setSmartMoveReminders}
              trackColor={{ false: '#ECE8DF', true: '#145C2E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Toggle 4: Market Price Alerts */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Market Price Alerts</Text>
              <Text style={styles.toggleSubtitle}>Daily market rate summaries</Text>
            </View>
            <Switch
              value={marketPriceAlerts}
              onValueChange={setMarketPriceAlerts}
              trackColor={{ false: '#ECE8DF', true: '#145C2E' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: App Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>App Preferences</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={() => navigation.navigate('Route')}>
            <View style={styles.menuRowLeft}>
              <MaterialIcons name="location-on" size={20} color="#707A6F" />
              <Text style={styles.menuRowTitle}>Location Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#C0C9BD" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} activeOpacity={0.8} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.menuRowLeft}>
              <MaterialIcons name="straighten" size={20} color="#707A6F" />
              <View>
                <Text style={styles.menuRowTitle}>Units</Text>
                <Text style={styles.menuRowSubtitle}>Acres</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#C0C9BD" />
          </TouchableOpacity>
        </View>

        {/* Section 4: Help & Support */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Help & Support</Text>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={() => navigation.navigate('HelpCenter')}>
            <Text style={styles.menuRowTitle}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={22} color="#C0C9BD" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={() => navigation.navigate('ContactSupport')}>
            <Text style={styles.menuRowTitle}>Contact Support</Text>
            <MaterialIcons name="chevron-right" size={22} color="#C0C9BD" />
          </TouchableOpacity>

          {/* Support Banner */}
          <View style={styles.supportBannerBox}>
            <MaterialIcons name="support-agent" size={28} color="#145C2E" />
            <Text style={styles.supportBannerTitle}>Need help using Annapurna?</Text>
            <TouchableOpacity style={styles.getSupportButton} activeOpacity={0.85} onPress={() => navigation.navigate('SupportChat')}>
              <Text style={styles.getSupportButtonText}>Get Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.saveAndContinueButton}
          onPress={() => navigation?.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={styles.saveAndContinueText}>Save & Go to Dashboard</Text>
        </TouchableOpacity>

        {/* Section 5: Footer Links */}
        <View style={styles.footerSection}>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.legalLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.legalLink}>Terms</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={() => {
            navigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.appVersionText}>App Version 1.4.2</Text>
        </View>
      </ScrollView>

      {/* Annapurna Vaani Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        navigation={navigation}
        defaultLanguage={selectedLanguage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF9F0',
  },
  header: {
    backgroundColor: '#FEF9F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#00431D',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECE8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#404940',
  },
  vaaniCard: {
    backgroundColor: '#145C2E',
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  vaaniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vaaniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaaniTextCol: {
    flex: 1,
    gap: 2,
  },
  vaaniCardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  vaaniCardDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#D4EAD6',
  },
  vaaniStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF9F0',
    borderRadius: 14,
    paddingVertical: 10,
  },
  vaaniStartBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#145C2E',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionHeading: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#00431D',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C0C9BD',
  },
  languageRowSelected: {
    borderColor: '#145C2E',
    backgroundColor: '#F8F3EA',
  },
  languageRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    color: '#404940',
  },
  languageNameSelected: {
    color: '#145C2E',
    fontWeight: '700',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C0C9BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#145C2E',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#145C2E',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8DF',
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1D1C16',
  },
  toggleSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8DF',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuRowTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1D1C16',
  },
  menuRowSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  supportBannerBox: {
    backgroundColor: 'rgba(164, 193, 168, 0.3)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(164, 193, 168, 0.5)',
    marginTop: 8,
  },
  supportBannerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#145C2E',
  },
  getSupportButton: {
    backgroundColor: '#145C2E',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  getSupportButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  saveAndContinueButton: {
    backgroundColor: '#145C2E',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 8,
  },
  saveAndContinueText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerSection: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  legalLinksRow: {
    flexDirection: 'row',
    gap: 24,
  },
  legalLink: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#707A6F',
    textDecorationLine: 'underline',
  },
  logoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#BA1A1A',
  },
  appVersionText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#C0C9BD',
  },
});
