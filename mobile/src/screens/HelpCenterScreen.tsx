import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { getFaq } from '../services/api';

const DEFAULT_FAQS = [
  { question: 'How does the 5-sample quality scanner work?', answer: 'Capture photos of 5 different fruits from your harvest batch. Annapurna analyzes color, blemishes, and fungal spots to compute overall AGMARK grade.' },
  { question: 'How often are mandi prices updated?', answer: 'Prices sync multiple times daily from government Agmarknet feeds and local APMC mandis.' },
  { question: 'What is Annapurna Vaani voice assistant?', answer: 'Vaani is your multilingual AI voice assistant that understands Telugu, Hindi, English, Marathi, Tamil, and Kannada to answer farming questions.' },
];

function HelpCenterScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(DEFAULT_FAQS);
  const [loadingFaq, setLoadingFaq] = useState(true);

  useEffect(() => {
    getFaq()
      .then((res) => {
        if (res && res.categories && Array.isArray(res.categories)) {
          const flattened: Array<{ question: string; answer: string }> = [];
          res.categories.forEach((cat: any) => {
            if (Array.isArray(cat.faqs)) {
              flattened.push(...cat.faqs);
            }
          });
          if (flattened.length > 0) setFaqs(flattened);
        }
      })
      .catch((err) => {
        console.warn('Failed to load FAQs:', err);
      })
      .finally(() => setLoadingFaq(false));
  }, []);

  const handleSendMessage = () => {
    if (!query.trim()) return;
    setQuery('');
    Alert.alert('Message Sent', 'An Annapurna agriculture specialist will respond to your query shortly.');
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Hotline Cards */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.85}>
            <View style={styles.contactIconBg}>
              <MaterialIcons name="phone" size={22} color="#145C2E" />
            </View>
            <Text style={styles.contactCardTitle}>Kisan Call Center</Text>
            <Text style={styles.contactCardSub}>1800-180-1551</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} activeOpacity={0.85}>
            <View style={styles.contactIconBg}>
              <MaterialCommunityIcons name="whatsapp" size={24} color="#145C2E" />
            </View>
            <Text style={styles.contactCardTitle}>WhatsApp Desk</Text>
            <Text style={styles.contactCardSub}>+91 98234 56789</Text>
          </TouchableOpacity>
        </View>

        {/* Message Box */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Ask an Agronomist</Text>
          <Text style={styles.cardSub}>
            Have a question about pest control, market routes, or shelf life? Write to our team.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Type your question or crop issue here..."
            placeholderTextColor="#8C968A"
            multiline
            numberOfLines={4}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity
            style={[styles.sendButton, !query.trim() && { opacity: 0.6 }]}
            onPress={handleSendMessage}
            activeOpacity={0.85}
          >
            <MaterialIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* Common FAQs */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Frequently Asked Questions</Text>
          {loadingFaq ? (
            <ActivityIndicator size="small" color="#145C2E" style={{ marginVertical: 12 }} />
          ) : (
            faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQ}>{faq.question}</Text>
                <Text style={styles.faqA}>{faq.answer}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(HelpCenterScreen, 'HelpCenter');

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
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...Shadows.card,
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCardTitle: { fontFamily: FontFamily.semibold, fontSize: 13, color: '#1D1C16' },
  contactCardSub: { fontFamily: FontFamily.bold, fontSize: 13, color: '#145C2E' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...Shadows.card,
  },
  cardHeader: { fontFamily: FontFamily.bold, fontSize: 17, color: '#00431D' },
  cardSub: { fontFamily: FontFamily.regular, fontSize: 13, color: '#556052', lineHeight: 18 },
  input: {
    backgroundColor: '#F8F5EE',
    borderRadius: 14,
    padding: 14,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#1D1C16',
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0DACD',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#145C2E',
    borderRadius: 14,
    paddingVertical: 12,
  },
  sendButtonText: { fontFamily: FontFamily.bold, fontSize: 14, color: '#FFFFFF' },
  faqItem: { gap: 4, marginTop: 6 },
  faqQ: { fontFamily: FontFamily.semibold, fontSize: 14, color: '#145C2E' },
  faqA: { fontFamily: FontFamily.regular, fontSize: 13, color: '#404940', lineHeight: 18 },
});
