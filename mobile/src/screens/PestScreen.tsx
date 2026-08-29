import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
} from '../constants/theme';
import {
  FadeInUp,
  AnimatedPressable,
} from '../components/Animations';
import { getRecentScans } from '../services/api';

const FARMER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAynR1UIqlYtF3umYkiv4VHPQHIsoGOaF9cNOzZul5zdwrqC2lCYYBkXGnwN2DWboJ1L976a3ehMgETAkNrzK3AnJ2Htqxu3FvykCx0L85oylzlkrks4WAaxN4sVYaiaeTlbt1TD0LEedpdeHTahbmpH7bCns7lNPposnxXkhRmUyAnF3Skcz7njOcvOWDFaGqBxBHzBIRiR9ftvhhOYTh7CEOgZBEbrDXMdW1OHZmIT8D-z90kmkHJYw';

const PADDY_LEAF_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDTx2BwGYwcHhhtJnRDQV7-nyKnATPbiG4vrNiXHV1LZ0Kz1LatNQBzuX_VmQncBYRXUNIahhSt0W4Y5xHru-aCOAMWMnjAEy8ihEejBLPkkEV4FKXixOsH5hS6LHz7rncfRC5OKWNW1XsQw-cKVcZbFByrcXQssKHqaQt-vEUWvAk6h3pTFxF8jbFUnZGXHFMTtwfAEMusEDx9itl_RVyg6nh8OyT4cJrerp_GWpqmKAUdvYa8zCMrqQ';

export default function PestScreen({ navigation }: any) {
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentScans()
      .then((res) => {
        setRecentScans(res.scans || []);
        setLoading(false);
      })
      .catch((err) => {
        console.info('[Pest] Failed to load recent scans:', err);
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBorder}>
            <Image source={{ uri: FARMER_AVATAR }} style={styles.avatar} resizeMode="cover" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Pest & Soil Hub</Text>
            <Text style={styles.headerSubtitle}>Check crop problems and soil health</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => navigation?.navigate('Notification')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="notifications" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Action Cards — FadeInUp */}
        <FadeInUp delay={80} duration={500}>
        <View style={styles.actionCardsRow}>
          {/* Pest Scanner Card */}
          <View style={styles.actionCard}>
            <View style={styles.pestIconCircle}>
              <MaterialCommunityIcons name="leaf" size={28} color={Colors.secondary} />
            </View>
            <Text style={styles.actionCardTitle}>Pest Scanner</Text>
            <Text style={styles.actionCardDesc}>
              Scan a leaf or crop problem for instant diagnosis
            </Text>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => navigation?.navigate('Scan')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="photo-camera" size={20} color={Colors.textOnPrimary} />
              <Text style={styles.primaryActionButtonText}>Start Scan</Text>
            </TouchableOpacity>
          </View>

          {/* Soil Scanner Card — Reduced padding */}
          <View style={styles.actionCard}>
            <View style={styles.soilIconCircle}>
              <MaterialIcons name="landscape" size={28} color={Colors.textOnDark} />
            </View>
            <Text style={styles.actionCardTitle}>Soil Scanner</Text>
            <Text style={styles.actionCardDesc}>
              Check soil condition and moisture levels
            </Text>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => navigation?.navigate('Scan')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="qr-code-scanner" size={20} color={Colors.primaryDark} />
              <Text style={styles.secondaryActionButtonText}>Scan Soil</Text>
            </TouchableOpacity>
          </View>
        </View>
        </FadeInUp>

        {/* Recent Scans Section — FadeInUp */}
        <FadeInUp delay={200} duration={500}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation?.navigate('CropBatches')}>
            <Text style={styles.viewHistoryLink}>View History</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={[styles.recentScanCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <ActivityIndicator size="large" color={Colors.primaryDark} />
            <Text style={{ fontFamily: FontFamily.regular, fontSize: Typography.small.fontSize, color: Colors.textMuted, marginTop: Spacing.sm }}>Loading recent scans...</Text>
          </View>
        ) : recentScans.length > 0 ? (
          <View style={{ gap: Spacing.sm }}>
            {recentScans.map((scan: any, idx: number) => (
              <View key={scan.id || idx} style={styles.recentScanCard}>
                <View style={styles.scanRow}>
                  <View style={styles.scanRowLeft}>
                    <View style={styles.scanImageContainer}>
                      <Image
                        source={{ uri: scan.image_uri || PADDY_LEAF_IMAGE }}
                        style={styles.scanImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View>
                      <Text style={styles.scanCropName}>{scan.crop_name || 'Crop Scan'}</Text>
                      <Text style={styles.scanDate}>{scan.scan_date ? new Date(scan.scan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Checked recently'}</Text>
                    </View>
                  </View>
                  {scan.issue_detected !== false ? (
                    <View style={styles.issueBadge}>
                      <MaterialIcons name="warning" size={14} color={Colors.warning} />
                      <Text style={styles.issueBadgeText}>Issue Detected</Text>
                    </View>
                  ) : (
                    <View style={[styles.issueBadge, { backgroundColor: Colors.successBg }]}>
                      <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                      <Text style={[styles.issueBadgeText, { color: Colors.success }]}>Healthy</Text>
                    </View>
                  )}
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultText}>{scan.result_text || 'Inspection completed'}</Text>
                  <TouchableOpacity
                    style={styles.viewResultButton}
                    activeOpacity={0.7}
                    onPress={() => navigation?.navigate('Analysis', { cropType: scan.crop_name, scanId: scan.id })}
                  >
                    <Text style={styles.viewResultText}>View Result</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.recentScanCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <MaterialCommunityIcons name="line-scan" size={40} color={Colors.textMuted} />
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: Typography.body.fontSize, color: Colors.textSecondary, marginTop: Spacing.sm }}>No recent scans found</Text>
            <Text style={{ fontFamily: FontFamily.regular, fontSize: Typography.small.fontSize, color: Colors.textMuted, marginTop: Spacing.xxs }}>Your pest and soil scans will appear here.</Text>
          </View>
        )}
        </FadeInUp>

        {/* Nearby Support Section — FadeInUp */}
        <FadeInUp delay={320} duration={500}>
        <Text style={styles.sectionTitle}>Nearby Support</Text>

        <View style={styles.supportCardsContainer}>
          <TouchableOpacity style={styles.supportCard} activeOpacity={0.8} onPress={() => navigation?.navigate('Market')}>
            <View style={styles.supportCardLeft}>
              <View style={styles.supportIconCircle}>
                <MaterialIcons name="storefront" size={24} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.supportCardTitle}>Crop-care Stores</Text>
                <Text style={styles.supportCardDesc}>Find pesticides and fertilizers</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportCard} activeOpacity={0.8} onPress={() => navigation?.navigate('Market')}>
            <View style={styles.supportCardLeft}>
              <View style={styles.supportIconCircle}>
                <MaterialIcons name="local-florist" size={24} color={Colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.supportCardTitle}>Nearby Nurseries</Text>
                <Text style={styles.supportCardDesc}>Healthy saplings and seeds</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.headerPadding,
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xs,
    paddingBottom: 100,
    gap: Spacing.sectionGap,
  },
  // Action cards — reduced vertical padding
  actionCardsRow: {
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingSm,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  pestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soilIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionCardDesc: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 200,
  },
  primaryActionButton: {
    width: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
    ...Shadows.button,
  },
  primaryActionButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  secondaryActionButton: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  secondaryActionButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewHistoryLink: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  recentScanCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingSm,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
    gap: Spacing.sm,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.sm,
  },
  scanRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scanImageContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.divider,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanCropName: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scanDate: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  issueBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: Colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xxs,
  },
  resultText: {
    fontFamily: FontFamily.medium,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  viewResultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  viewResultText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  supportCardsContainer: {
    gap: Spacing.md,
  },
  supportCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  supportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  supportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCardTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  supportCardDesc: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
});
