import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { withErrorBoundary } from '../components/ErrorBoundary';

function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: August 2026</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.bodyText}>
            Annapurna collects farmer location (to provide accurate local Mandi prices and weather alerts),
            crop scan images (for AI quality and disease detection), and basic farm metrics to optimize
            shelf life and transport recommendations.
          </Text>

          <Text style={styles.sectionTitle}>2. How Your Data Is Used</Text>
          <Text style={styles.bodyText}>
            Your data is used solely to generate agronomic advice, market intelligence, spoilage velocity
            models, and secure batch records for post-harvest traceability.
          </Text>

          <Text style={styles.sectionTitle}>3. Local-First & Offline Privacy</Text>
          <Text style={styles.bodyText}>
            Transactions and field telemetry are encrypted on-device. Data synchronization only occurs
            when an active, authorized connection is established.
          </Text>

          <Text style={styles.sectionTitle}>4. Contact Us</Text>
          <Text style={styles.bodyText}>
            For privacy inquiries or data management requests, please reach out to our dedicated support
            team at support@annapurna-freshguard.org.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(PrivacyPolicyScreen, 'PrivacyPolicy');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FEF9F0' },
  header: {
    backgroundColor: '#FEF9F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: '#00431D' },
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  lastUpdated: { fontFamily: FontFamily.regular, fontSize: 13, color: '#707A6F' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...Shadows.card,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 16, color: '#00431D', marginTop: 8 },
  bodyText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 22, color: '#404940' },
});
