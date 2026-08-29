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

function TermsScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: August 2026</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
          <Text style={styles.bodyText}>
            By accessing and using Annapurna, you agree to comply with these terms governing agricultural
            decision support, quality grading, and mandi market intelligence.
          </Text>

          <Text style={styles.sectionTitle}>2. Advisory Nature of AI Predictions</Text>
          <Text style={styles.bodyText}>
            Crop quality assessments, spoilage risk alerts, and Smart Move price predictions are generated
            using machine learning models and real-time sensor data. They serve as actionable guidance to
            empower farmer decision-making.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts & Security</Text>
          <Text style={styles.bodyText}>
            Farmers and market operators are responsible for maintaining account confidentiality and
            ensuring accurate field location and crop batch parameters.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(TermsScreen, 'Terms');

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
