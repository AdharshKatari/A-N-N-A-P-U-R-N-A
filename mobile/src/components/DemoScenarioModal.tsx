import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import { GlassCard, GlassBadge, GlassButton } from './GlassPrimitives';
import { KisanVoiceSpeaker } from './KisanVoiceSpeaker';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DemoScenarioModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSmartMove?: () => void;
  onNavigateToScan?: () => void;
  onNavigateToBatches?: () => void;
}

export function DemoScenarioModal({
  visible,
  onClose,
  onNavigateToSmartMove,
  onNavigateToScan,
  onNavigateToBatches,
}: DemoScenarioModalProps) {
  const { language } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: "1. 5-Fruit AI Scan",
      icon: "camera-alt",
      badge: "AGMARK 88/100",
      content: {
        headline: "Camera Multi-Fruit Sampling",
        summary: "Kisan Ramesh laid 5 sample tomatoes flat and scanned them in seconds.",
        metrics: [
          { label: "AGMARK Freshness Grade", value: "88/100 (Grade-A Premium)", color: "#4E9B42" },
          { label: "Color Ripeness Stage", value: "Optimal (Turning Red)", color: "#2E7D32" },
          { label: "Pathogen Rot Lesions", value: "0% Surface Blight / No Spores", color: "#4E9B42" },
          { label: "AI Model Used", value: "Gemini 2.5 Flash + Custom ML", color: Colors.primaryDeep },
        ],
        voiceText: "Five fruit sample scan completed. Certified AGMARK 88 out of 100 Grade A quality with zero fungal rot.",
      },
    },
    {
      id: 2,
      title: "2. ISRO Satellite",
      icon: "satellite-alt",
      badge: "NDVI 0.78 Vigor",
      content: {
        headline: "ISRO Bhoonidhi Remote Sensing",
        summary: "Live satellite canopy index pulled from ISRO VEDAS and Bhoonidhi APIs.",
        metrics: [
          { label: "Pre-Harvest NDVI Index", value: "0.78 (High Canopy Health)", color: "#2E7D32" },
          { label: "Satellite Sensor", value: "ResourceSat-2 AWIFS Spectral", color: Colors.primaryDeep },
          { label: "Ambient Field Temp", value: "34°C (Open Sunlight)", color: "#E8A317" },
          { label: "Soil Moisture Stress", value: "Low Stress (42 kPa)", color: "#4E9B42" },
        ],
        voiceText: "ISRO satellite verification confirms healthy canopy with high NDVI index of 0.78.",
      },
    },
    {
      id: 3,
      title: "3. Q10 Bio-Clock",
      icon: "timelapse",
      badge: "6.8 Days Safe",
      content: {
        headline: "Biological Respiration Kinetics",
        summary: "Computed exponential Q10 decay velocity and ethylene gas accumulation.",
        metrics: [
          { label: "Q10 Decay Constant", value: "2.2x per 10°C elevation", color: Colors.primaryDeep },
          { label: "Decay Velocity @ 34°C", value: "2.2x Normal Respiration", color: "#E8A317" },
          { label: "Safe In-Transit Life", value: "6.8 Days Remaining", color: "#4E9B42" },
          { label: "Ethylene Co-Load Alert", value: "Safe (Ventilated Truck)", color: "#2E7D32" },
        ],
        voiceText: "At 34 degrees Celsius, tomatoes decay 2.2 times faster. Safe transit shelf life is 6.8 days.",
      },
    },
    {
      id: 4,
      title: "4. Mandi Arbitrage",
      icon: "trending-up",
      badge: "+₹4,875 Profit",
      content: {
        headline: "Smart Move Arbitrage Comparison",
        summary: "Calculates true net pocket cash after subtracting ₹5/km freight overhead.",
        metrics: [
          { label: "Local Nashik Mandi", value: "₹22/kg • Net Profit: ₹10,925", color: "#D14343" },
          { label: "Mumbai Vashi APMC", value: "₹34/kg (+54% Premium)", color: "#2E7D32" },
          { label: "Freight (168km @ ₹5/km)", value: "₹840 Total Fuel/Toll", color: Colors.textSecondary },
          { label: "NET PROFIT IN POCKET", value: "₹15,800 (+₹4,875 Extra Gain!)", color: "#2E7D32" },
        ],
        voiceText: "Mumbai Vashi APMC pays 34 rupees per kg. After 840 rupees freight, Ramesh earns 4,875 rupees extra profit.",
      },
    },
    {
      id: 5,
      title: "5. Plan-B Rescue",
      icon: "security",
      badge: "₹20/kg Guaranteed",
      content: {
        headline: "PostGIS Plan-B Salvage Routing",
        summary: "Emergency diversion to prevent 100% loss or distress highway dumping.",
        metrics: [
          { label: "Backup Salvage Hub", value: "Thane Puree Processing Factory", color: Colors.primaryDeep },
          { label: "Guaranteed Floor Price", value: "₹20/kg Floor Cash", color: "#2E7D32" },
          { label: "Distance from Highway", value: "14 km (45 mins detour)", color: Colors.textSecondary },
          { label: "Distress Dump Risk", value: "0% Elimination of Waste", color: "#4E9B42" },
        ],
        voiceText: "Plan-B PostGIS router locks Thane puree factory guaranteeing 20 rupees per kg if highway delay occurs.",
      },
    },
    {
      id: 6,
      title: "6. QR Passport",
      icon: "qr-code-scanner",
      badge: "Certified Batch",
      content: {
        headline: "Tamper-Proof Kisan QR Certificate",
        summary: "Cryptographic batch certificate for instant wholesale buyer auction verification.",
        metrics: [
          { label: "Batch ID", value: "BAT-2026-TOM-01", color: Colors.textPrimary },
          { label: "Certified Freshness", value: "AGMARK 88/100 Grade-A", color: "#2E7D32" },
          { label: "Cryptographic Hash", value: "SHA256-KMY-88-NASHIK", color: Colors.primaryDeep },
          { label: "APMC Auction Result", value: "Sold at Full ₹34/kg (Zero Discount)", color: "#2E7D32" },
        ],
        voiceText: "Tamper-proof Kisan QR certificate generated. Buyer scans at auction gate and pays full price without discount.",
      },
    },
  ];

  const current = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.topTitleGroup}>
              <View style={styles.badgeSIH}>
                <Text style={styles.badgeSIHText}>SIH 2026 LIVE DEMO</Text>
              </View>
              <Text style={styles.mainTitle}>Kisan Ramesh: 500kg Tomatoes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Horizontal Step Selector Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepChipsContainer}
          >
            {steps.map((s) => {
              const isSelected = s.id === activeStep;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setActiveStep(s.id)}
                  style={[
                    styles.stepChip,
                    isSelected && styles.stepChipSelected,
                  ]}
                >
                  <MaterialIcons
                    name={s.icon as any}
                    size={16}
                    color={isSelected ? '#FFFFFF' : Colors.primaryDeep}
                  />
                  <Text style={[styles.stepChipText, isSelected && styles.stepChipTextSelected]}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Step Content Card */}
          <ScrollView style={styles.stepBody} showsVerticalScrollIndicator={false}>
            <View style={styles.stepCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepHeadline}>{current.content.headline}</Text>
                <Text style={styles.stepSummary}>{current.content.summary}</Text>
              </View>
              <KisanVoiceSpeaker textToSpeak={current.content.voiceText} size="small" variant="filled" />
            </View>

            {/* Metrics List */}
            <View style={styles.metricsBox}>
              {current.content.metrics.map((m, idx) => (
                <View key={idx} style={styles.metricRow}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                </View>
              ))}
            </View>

            {/* Step 4 Special Profit Comparison Graphic */}
            {activeStep === 4 && (
              <View style={styles.profitBanner}>
                <MaterialCommunityIcons name="cash-multiple" size={28} color="#2E7D32" />
                <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                  <Text style={styles.profitBannerTitle}>Net Pocket Profit Gain: +₹4,875</Text>
                  <Text style={styles.profitBannerSub}>
                    Ramesh earns ₹15,800 at Vashi APMC instead of ₹10,925 in Nashik distress sale!
                  </Text>
                </View>
              </View>
            )}

            {/* Step 6 QR Code Graphic */}
            {activeStep === 6 && (
              <View style={styles.qrDisplayBox}>
                <MaterialCommunityIcons name="qrcode-scan" size={64} color={Colors.primaryDeep} />
                <Text style={styles.qrTokenText}>Token: QR-TOM-98234-PASSPORT</Text>
                <Text style={styles.qrVerifiedBadge}>✓ Cryptographically Verified by FreshGuard</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActionsRow}>
            {activeStep > 1 && (
              <TouchableOpacity
                style={styles.navButtonSecondary}
                onPress={() => setActiveStep(prev => prev - 1)}
              >
                <MaterialIcons name="chevron-left" size={20} color={Colors.primaryDeep} />
                <Text style={styles.navButtonSecondaryText}>Previous</Text>
              </TouchableOpacity>
            )}

            {activeStep < 6 ? (
              <TouchableOpacity
                style={styles.navButtonPrimary}
                onPress={() => setActiveStep(prev => prev + 1)}
              >
                <Text style={styles.navButtonPrimaryText}>Next: Step {activeStep + 1}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButtonPrimary, { backgroundColor: Colors.primaryDeep }]}
                onPress={() => {
                  onClose();
                  onNavigateToSmartMove?.();
                }}
              >
                <Text style={styles.navButtonPrimaryText}>Open Live Smart Move</Text>
                <MaterialIcons name="rocket-launch" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  topTitleGroup: {
    flex: 1,
  },
  badgeSIH: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeSIHText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  stepChipsContainer: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(107, 163, 90, 0.3)',
  },
  stepChipSelected: {
    backgroundColor: Colors.primaryDeep,
    borderColor: Colors.primary,
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDeep,
  },
  stepChipTextSelected: {
    color: '#FFFFFF',
  },
  stepBody: {
    marginVertical: Spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.48,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stepHeadline: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepSummary: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricsBox: {
    backgroundColor: '#F9FAF8',
    borderRadius: 16,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  profitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: Spacing.sm,
    borderRadius: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  profitBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  profitBannerSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  qrDisplayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 163, 90, 0.4)',
  },
  qrTokenText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDeep,
    marginTop: Spacing.xs,
  },
  qrVerifiedBadge: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 4,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  navButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  navButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDeep,
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    gap: 4,
  },
  navButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
