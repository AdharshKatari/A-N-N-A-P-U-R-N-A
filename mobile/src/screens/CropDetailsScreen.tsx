import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getBatch, getLogs, getLogAnalytics, getPassport, updateBatchStatus, deleteBatch } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import { ShowQr } from '../components/ShowQr';
import { withErrorBoundary } from '../components/ErrorBoundary';
import MapSearchBar from '../components/MapSearchBar';
import { GeocodingResult } from '../services/geocoding';
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
  FadeIn,
  ScaleIn,
  AnimatedPressable,
} from '../components/Animations';
import { AccordionMenu } from '../components/AccordionMenu';

// Default field coordinates (Nashik, Maharashtra) — overridden by batch data when available
const DEFAULT_FIELD_COORDS = { latitude: 19.9975, longitude: 73.7898 };

const PADDY_FIELD_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBWl6Yzrq1L3IuHdOY3dYC4XC4cQ3kgDKkogzlIL7KoHfzYlB_jLfKKp_yFjifNUj3QEErmxAHMHfs6O25EI7IPkhw8IhV7bNIb41A7OqZ8T8AUV7H37jo-d6jvE8gBC85waHscVbAO0NWP7_Iswjk4a93jfT6b0xneqsdCaAGyt_iNQkuCXnwd4-iCXMUpdiHyPxgFhabfFvaH3wfq_RLZ-4fKloryOB2VCrEv1QGYaNZ5vZxHRVb_vg';

const formatDetailDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not recorded';

const Detail = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.accordionDetail}>
    <Text style={styles.accordionLabel}>{label}</Text>
    <Text style={styles.accordionValue}>{value}</Text>
  </View>
);

function CropDetailsScreen({ navigation, route }: any) {
  const crop = route?.params?.crop || 'Paddy';
  const field = route?.params?.field || 'East Field';
  const batchId = route?.params?.batchId;
  const plantingDate = route?.params?.plantingDate as string | undefined;
  const expectedHarvestDate = route?.params?.expectedHarvestDate as string | undefined;

  const [batchData, setBatchData] = useState<any>(() => ({
    batch_id: batchId || 'BAT-2026-TOM-01',
    field_id: cropName ? `${cropName} - Field Plot 1` : 'Tomato (Hybrid Roma) - East Field',
    initial_weight_kg: 500,
    harvest_timestamp: new Date().toISOString(),
    initial_visual_score: 88,
    detected_ripeness_stage: 'Turning / Light Red',
    fungal_pathogen_presence: false,
    macro_satellite_modifier: 1.05,
    micro_drone_modifier: 1.0,
    logistics_road_penalty: 1.0,
    current_status: 'ACTIVE',
    qr_code_secure_token: 'QR-TOM-98234-PASSPORT',
  }));
  const [logs, setLogs] = useState<any[]>([
    { timestamp: new Date(Date.now() - 3600000).toISOString(), temperature_c: 26.5, humidity_rh: 62.0, condition: 'Optimal' },
    { timestamp: new Date(Date.now() - 7200000).toISOString(), temperature_c: 28.1, humidity_rh: 58.4, condition: 'Normal' },
  ]);
  const [analytics, setAnalytics] = useState<any>({ thermal_degree_hours: 142.5, spoilage_risk_index: 12, cumulative_shelf_loss_days: 0.4 });
  const [passportData, setPassportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number }>(DEFAULT_FIELD_COORDS);
  const [searchMarker, setSearchMarker] = useState<{ latitude: number; longitude: number; title: string } | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const [batchRes, logsRes, analyticsRes, passportRes] = await Promise.allSettled([
        getBatch(batchId),
        getLogs(batchId, 20),
        getLogAnalytics(batchId),
        getPassport(batchId),
      ]);
      if (batchRes.status === 'fulfilled') setBatchData(batchRes.value?.batch);
      else setError('Failed to load batch details.');
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value?.logs || []);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value?.analytics);
      if (passportRes.status === 'fulfilled') setPassportData(passportRes.value);
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Failed to fetch batch details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [batchId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails(true);
  }, [fetchDetails]);

  const handleSearchResult = useCallback((result: GeocodingResult) => {
    setMapCenter({ latitude: result.latitude, longitude: result.longitude });
    setSearchMarker({ latitude: result.latitude, longitude: result.longitude, title: result.address?.name || result.displayName.split(',')[0] });
    setMapKey((k) => k + 1);
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!batchId) return;
    try {
      await updateBatchStatus(batchId, newStatus);
      setBatchData((prev: any) => ({ ...prev, current_status: newStatus }));
      Alert.alert('Status Updated', `Batch status changed to ${newStatus}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleDeleteBatch = () => {
    if (!batchId) return;
    Alert.alert(
      'Delete Batch',
      'Are you sure you want to delete this crop batch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBatch(batchId);
              Alert.alert('Batch Deleted', 'The batch has been removed.', [
                { text: 'OK', onPress: () => navigation?.navigate('CropBatches') },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete batch');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Crop Details</Text>
          <View style={styles.scanCapturedRow}>
            <MaterialIcons name="check-circle" size={14} color={Colors.secondary} />
            <Text style={styles.scanCapturedText}>Scan captured</Text>
          </View>
        </View>

        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={22} color={Colors.primaryDark} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryDark} />
        }
      >
        {/* Hero Section: Crop Photo — ScaleIn */}
        <ScaleIn delay={0} duration={600}>
        <View style={styles.heroCard}>
          <Image source={{ uri: PADDY_FIELD_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <View>
              <Text style={styles.heroCropTitle}>{batchData?.field_id || crop}</Text>
              <Text style={styles.heroFieldSubtitle}>{field}</Text>
            </View>
            <View style={styles.scannedJustNowBadge}>
              <MaterialIcons name="schedule" size={14} color={Colors.textOnPrimary} />
              <Text style={styles.scannedJustNowText}>{batchData?.current_status || 'Active'}</Text>
            </View>
          </View>
        </View>
        </ScaleIn>

        {/* Field Location Map — FadeInUp */}
        <FadeInUp delay={120} duration={500}>
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <MaterialIcons name="place" size={20} color={Colors.primaryDark} />
            <Text style={styles.mapTitle}>Field Location</Text>
          </View>
          <MapSearchBar
            onResultSelect={handleSearchResult}
            placeholder="Search for a field location..."
          />
          <LeafletMap
            key={mapKey}
            latitude={mapCenter.latitude}
            longitude={mapCenter.longitude}
            zoom={15}
            markers={searchMarker ? [{
              id: 'search',
              latitude: searchMarker.latitude,
              longitude: searchMarker.longitude,
              title: searchMarker.title,
              color: '#E65100',
              icon: '🔍',
            }] : [{
              id: 'field',
              latitude: batchData?.latitude || DEFAULT_FIELD_COORDS.latitude,
              longitude: batchData?.longitude || DEFAULT_FIELD_COORDS.longitude,
              title: batchData?.field_id || field,
              subtitle: crop,
              color: '#145C2E',
              icon: '🌾',
            }]}
            showUserLocation={false}
            height={220}
          />
        </View>
        </FadeInUp>

        {/* Structured crop details accordion */}
        <FadeInUp delay={200} duration={500}>
          <AccordionMenu
            allowMultiple
            defaultOpenItems={['crop-info']}
            items={[
              {
                id: 'crop-info',
                title: 'Crop Information',
                icon: '🌱',
                content: (
                  <View style={styles.accordionGrid}>
                    <Detail label="Crop" value={crop} />
                    <Detail label="Field" value={batchData?.field_id || field} />
                    <Detail label="Planted" value={formatDetailDate(plantingDate)} />
                    <Detail label="Batch ID" value={batchData?.batch_id?.slice(0, 12) || 'N/A'} />
                    <Detail label="Weight" value={`${batchData?.initial_weight_kg || 0} kg`} />
                  </View>
                ),
              },
              {
                id: 'health',
                title: 'Growth & Health',
                icon: '💚',
                content: (
                  <View style={styles.accordionGrid}>
                    <Detail label="Visual score" value={`${batchData?.initial_visual_score || 85}%`} />
                    <Detail label="Growth stage" value={batchData?.detected_ripeness_stage || 'Optimal'} />
                    <Detail label="Spoilage risk" value={analytics?.spoilage_risk_class || analytics?.spoilage_risk || 'LOW'} />
                    <Detail label="Current status" value={batchData?.current_status || 'ACTIVE'} />
                  </View>
                ),
              },
              {
                id: 'harvest',
                title: 'Harvest Details',
                icon: '📦',
                content: (
                  <View style={styles.accordionGrid}>
                    <Detail label="Expected harvest" value={formatDetailDate(expectedHarvestDate)} />
                    <Detail label="Estimated quantity" value={`${batchData?.initial_weight_kg || 0} kg`} />
                    <Detail
                      label="Temperature"
                      value={
                        analytics?.temperature?.avg_c != null
                          ? `${analytics.temperature.avg_c}°C`
                          : analytics?.avg_temperature_c
                          ? `${analytics.avg_temperature_c}°C`
                          : 'Optimal'
                      }
                    />
                    <Detail
                      label="Humidity"
                      value={
                        analytics?.humidity?.avg_pct != null
                          ? `${analytics.humidity.avg_pct}%`
                          : analytics?.avg_humidity_pct
                          ? `${analytics.avg_humidity_pct}%`
                          : 'Optimal'
                      }
                    />
                  </View>
                ),
              },
              {
                id: 'recommendations',
                title: 'Recommendations',
                icon: '💡',
                content: (
                  <View style={styles.recommendationBox}>
                    <MaterialIcons name="tips-and-updates" size={19} color={Colors.primaryDeep} />
                    <Text style={styles.recommendationText}>
                      {(analytics?.spoilage_risk_class === 'HIGH' || analytics?.spoilage_risk_class === 'CRITICAL')
                        ? 'High accumulated thermal exposure. Prioritize Smart Move route and prepare this batch for immediate dispatch.'
                        : logs.length > 0
                          ? `Thermal status: ${analytics?.temperature_trend || 'STABLE'} (${analytics?.degree_hours_above_optimal ?? 0} degree-hrs above 12°C). Produce is healthy.`
                          : 'Produce is in optimal storage conditions. Run a crop analysis to simulate live market transit.'}
                    </Text>
                  </View>
                ),
              },
            ]}
          />
        </FadeInUp>

        {/* Digital QR Passport Section */}
        <FadeInUp delay={260} duration={500}>
          <ShowQr
            value={passportData?.qr_passport_token || batchData?.qr_code_secure_token || `BID:${batchData?.batch_id || batchId}|CRP:${crop}|WGT:${batchData?.initial_weight_kg || 500}|VSC:${batchData?.initial_visual_score || 85}`}
            buttonLabel="Digital QR Passport"
          />
        </FadeInUp>

        {/* Action Section — FadeInUp */}
        <FadeInUp delay={440} duration={500}>
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => navigation?.navigate('Analysis', { cropType: crop, field })}
            activeOpacity={0.85}
          >
            <MaterialIcons name="troubleshoot" size={22} color={Colors.textOnPrimary} />
            <Text style={styles.primaryActionText}>Analyze Crop</Text>
          </TouchableOpacity>

          {/* 12px between button and explanation */}
          <Text style={styles.actionNote}>
            AI will check crop condition, visible issues, and possible risks.
          </Text>

          {/* 20px before Retake */}
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => navigation?.navigate('Scan')}
            activeOpacity={0.85}
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>

          {/* Status & Lifecycle Management */}
          <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: Typography.bodySm.fontSize, color: Colors.textPrimary }}>
              Manage Batch Lifecycle
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: batchData?.current_status === 'SOLD' ? '#E8F5E9' : '#FFFFFF',
                  borderColor: '#145C2E',
                  borderWidth: 1,
                  borderRadius: BorderRadius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                onPress={() => handleStatusUpdate('SOLD')}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: FontFamily.semibold, fontSize: 13, color: '#145C2E' }}>
                  ✓ Mark as Sold
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: batchData?.current_status === 'TRANSIT' ? '#FFF8E1' : '#FFFFFF',
                  borderColor: '#F57F17',
                  borderWidth: 1,
                  borderRadius: BorderRadius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
                onPress={() => handleStatusUpdate('TRANSIT')}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: FontFamily.semibold, fontSize: 13, color: '#F57F17' }}>
                  🚚 Mark in Transit
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                marginTop: 4,
                paddingVertical: 8,
                alignItems: 'center',
              }}
              onPress={handleDeleteBatch}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: FontFamily.regular, fontSize: 13, color: Colors.error }}>
                Delete this Batch
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </FadeInUp>
        {/* Loading State */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={Colors.primaryDark} />
            <Text style={{ fontFamily: FontFamily.regular, fontSize: Typography.small.fontSize, color: Colors.textSecondary, marginTop: 12 }}>Loading batch details...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.observationCard, { alignItems: 'center', padding: 30 }]}>
            <MaterialIcons name="error-outline" size={40} color={Colors.warning} />
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: Typography.body.fontSize, color: Colors.textSecondary, marginTop: 12 }}>{error}</Text>
            <TouchableOpacity
              style={{ backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.xl, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}
              onPress={() => fetchDetails()}
            >
              <Text style={{ fontFamily: FontFamily.semibold, fontSize: Typography.bodyMd.fontSize, color: Colors.textOnPrimary }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(CropDetailsScreen, 'Crop Details');

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
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scanCapturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
  scanCapturedText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xs,
    paddingBottom: 100,
    gap: Spacing.sectionGap,
  },
  // Hero card
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    height: 200,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroCropTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  heroFieldSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.bodyMd.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Spacing.xxs,
  },
  mapSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingSm,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mapTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scannedJustNowBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm - 2,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  scannedJustNowText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: Colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  // Info card
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingSm,
    ...Shadows.card,
  },
  infoSectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  infoGridCol: {
    width: '45%',
    gap: Spacing.xxs,
  },
  infoLabel: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accordionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  accordionDetail: {
    width: '47%',
    gap: Spacing.xxs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  accordionLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  accordionValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.textPrimary,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successBg,
  },
  recommendationText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  // Observation card
  observationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.cardPaddingSm,
    ...Shadows.card,
  },
  obsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  obsHeading: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.bodyLg.fontSize,
    lineHeight: Typography.bodyLg.lineHeight,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  obsBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amberDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.warning,
  },
  obsBoxText: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.bodyMd.fontSize,
    lineHeight: Typography.bodyMd.lineHeight,
    color: Colors.textPrimary,
    flex: 1,
  },
  // Action section — refined spacing
  actionSection: {
    gap: Spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.glass2,
  },
  primaryActionText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
  actionNote: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
