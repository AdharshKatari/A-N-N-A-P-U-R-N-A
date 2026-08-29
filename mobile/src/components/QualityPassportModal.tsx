import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import { GlassCard, GlassBadge, GlassButton } from './GlassPrimitives';
import { ShowQr } from './ShowQr';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface QualityPassportModalProps {
  visible: boolean;
  onClose: () => void;
  batchId?: string;
  cropType?: string;
  weightKg?: number;
  visualScore?: number;
  ripenessStage?: string;
  gradeTier?: string;
  shelfLifeDays?: number;
  field?: string;
  qrToken?: string;
  harvestDate?: string;
}

export function QualityPassportModal({
  visible,
  onClose,
  batchId = 'BAT-2026-TOM-01',
  cropType = 'Tomatoes',
  weightKg = 500,
  visualScore = 88,
  ripenessStage = 'Optimal Pink',
  gradeTier = 'Grade-A',
  shelfLifeDays = 6.8,
  field = 'East Field, Nashik',
  qrToken = 'QR-TOM-98234-PASSPORT',
  harvestDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
}: QualityPassportModalProps) {
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌾 Annapurna Verified Quality Passport\nBatch: ${batchId}\nCrop: ${cropType} (${weightKg} kg)\nQuality: AGMARK ${gradeTier} (${visualScore}/100)\nToken: ${qrToken}\nVerified via FreshGuard Bio-Engine.`,
      });
    } catch (e) {
      console.warn('Error sharing passport:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.badgePassport}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#15803D" />
                <Text style={styles.badgePassportText}>OFFICIAL KISAN PASSPORT</Text>
              </View>
              <Text style={styles.mainTitle}>{cropType} • {weightKg} kg</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              <ShowQr value={qrToken} />
              <Text style={styles.qrSubText}>Scan at Mandi Auction Gate for Instant Verification</Text>
              <Text style={styles.qrTokenHash}>Secure Token: {qrToken}</Text>
            </View>

            {/* Quality Summary Box */}
            <View style={styles.qualitySummaryCard}>
              <View style={styles.qualityScoreRow}>
                <View>
                  <Text style={styles.qualityScoreLabel}>AGMARK Quality Grade</Text>
                  <Text style={styles.qualityScoreNumber}>{visualScore}/100 Grade-A</Text>
                </View>
                <View style={styles.gradeBadge}>
                  <MaterialIcons name="verified" size={18} color="#FFFFFF" />
                  <Text style={styles.gradeBadgeText}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Ripeness Stage</Text>
                  <Text style={styles.specValue}>{ripenessStage}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Harvest Date</Text>
                  <Text style={styles.specValue}>{harvestDate}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Origin Field</Text>
                  <Text style={styles.specValue}>{field}</Text>
                </View>
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Batch ID</Text>
                  <Text style={styles.specValue}>{batchId}</Text>
                </View>
              </View>
            </View>

            {/* Buyer Trust Guarantee */}
            <View style={styles.trustBanner}>
              <MaterialIcons name="lock-outline" size={20} color="#15803D" />
              <Text style={styles.trustText}>
                Tamper-proof cryptographic guarantee. Protects against unfair middleman price discounts.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <MaterialIcons name="share" size={20} color={Colors.primaryDeep} />
              <Text style={styles.shareBtnText}>Share Passport</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
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
    maxHeight: '90%',
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitleGroup: {
    flex: 1,
  },
  badgePassport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgePassportText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: '#F9FAF8',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 163, 90, 0.25)',
    marginVertical: Spacing.xs,
  },
  qrSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  qrTokenHash: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  qualitySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: Spacing.sm,
  },
  qualityScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityScoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  qualityScoreNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.sm,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specItem: {
    width: (SCREEN_WIDTH - 80) / 2,
  },
  specLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: Spacing.sm,
    borderRadius: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  trustText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: Colors.primaryDeep,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
