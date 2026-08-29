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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api, Batch, DashboardStats } from '../lib/apiClient';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { FadeIn, ScaleIn, MotionTokens } from '../components/Animations';
import { useReducedMotion } from '../components/GlassPrimitives';
import { QualityPassportModal } from '../components/QualityPassportModal';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_CROP_THUMB =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCu1LldaJyt1LeNw8sJob3m06qXxXREEE1DfK5y3_ua6l_Us851_OzYo1xv-db5AKhVUgioai6piRotqMeY3HVUxKY40g0SU-mRva0FQjXYS2_-Tr3QHd8rDqrGohfeic2SGQaqZ9wCYcwJi2NcGuStT6jxbnpQm3ftYo79FYhbhRETbpT5OiHZ8b_QPcXUotIMAKJRJssYOZMFmfo9sWd74ma-vZ8L48aMBA_1uBEcdUfpvCetcDoVrA';

const FALLBACK_BATCHES: Batch[] = [
  {
    batch_id: 'BAT-2026-TOM-01',
    field_id: 'Tomato (Hybrid Roma) - East Field',
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
  },
  {
    batch_id: 'BAT-2026-ONI-02',
    field_id: 'Red Onion - North Field',
    initial_weight_kg: 1200,
    harvest_timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    initial_visual_score: 92,
    detected_ripeness_stage: 'Harvest Ready / Cured',
    fungal_pathogen_presence: false,
    macro_satellite_modifier: 1.02,
    micro_drone_modifier: 1.0,
    logistics_road_penalty: 1.0,
    current_status: 'ACTIVE',
    qr_code_secure_token: 'QR-ONI-44182-PASSPORT',
  },
  {
    batch_id: 'BAT-2026-PAD-03',
    field_id: 'Paddy (Basmati 1121) - South Plot',
    initial_weight_kg: 850,
    harvest_timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    initial_visual_score: 81,
    detected_ripeness_stage: 'Mature Grain',
    fungal_pathogen_presence: false,
    macro_satellite_modifier: 0.98,
    micro_drone_modifier: 1.0,
    logistics_road_penalty: 1.0,
    current_status: 'ACTIVE',
    qr_code_secure_token: 'QR-PAD-67812-PASSPORT',
  },
  {
    batch_id: 'BAT-2026-MAN-04',
    field_id: 'Alphonso Mango - Orchard Block 2',
    initial_weight_kg: 400,
    harvest_timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    initial_visual_score: 94,
    detected_ripeness_stage: 'Firm Ripe',
    fungal_pathogen_presence: false,
    macro_satellite_modifier: 1.10,
    micro_drone_modifier: 1.0,
    logistics_road_penalty: 1.0,
    current_status: 'SOLD',
    qr_code_secure_token: 'QR-MAN-11928-PASSPORT',
  },
];

function CropBatchesScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [batches, setBatches] = useState<Batch[]>(FALLBACK_BATCHES);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [selectedPassportBatch, setSelectedPassportBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const statusFilter = activeFilter === 'active' ? 'ACTIVE' : activeFilter === 'completed' ? 'SOLD' : undefined;
      
      const [batchRes, dashRes] = await Promise.allSettled([
        api.batches.list({ status: statusFilter, limit: 50 }),
        api.dashboard.get(),
      ]);
      
      if (batchRes.status === 'fulfilled' && batchRes.value?.batches && batchRes.value.batches.length > 0) {
        setBatches(batchRes.value.batches);
      } else {
        const filtered = activeFilter === 'all'
          ? FALLBACK_BATCHES
          : FALLBACK_BATCHES.filter((b) => (activeFilter === 'active' ? b.current_status === 'ACTIVE' : b.current_status === 'SOLD'));
        setBatches(filtered);
      }
      
      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value);
      } else {
        setDashboard({
          totals: { batch_count: 4, total_weight_kg: 2950, avg_visual_score: 88.75 },
          by_status: [
            { current_status: 'ACTIVE', batch_count: 3, total_weight_kg: 2550 },
            { current_status: 'SOLD', batch_count: 1, total_weight_kg: 400 },
          ],
          by_risk_tier: [{ risk_tier: 'LOW', batch_count: 4, total_weight_kg: 2950 }],
          by_crop_category: [
            { crop_category: 'Tomato', batch_count: 1, total_weight_kg: 500 },
            { crop_category: 'Onion', batch_count: 1, total_weight_kg: 1200 },
            { crop_category: 'Paddy', batch_count: 1, total_weight_kg: 850 },
            { crop_category: 'Mango', batch_count: 1, total_weight_kg: 400 },
          ],
          pathogen_alerts: 0,
          recent_batches: [],
        });
      }
    } catch (err) {
      console.warn('Batch fetch warning, using offline batches:', err);
      const filtered = activeFilter === 'all'
        ? FALLBACK_BATCHES
        : FALLBACK_BATCHES.filter((b) => (activeFilter === 'active' ? b.current_status === 'ACTIVE' : b.current_status === 'SOLD'));
      setBatches(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCropThumbnail = (fieldId: string | undefined) => {
    if (!fieldId) return DEFAULT_CROP_THUMB;
    const crop = fieldId.toLowerCase();
    if (crop.includes('tomato')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu1LldaJyt1LeNw8sJob3m06qXxXREEE1DfK5y3_ua6l_Us851_OzYo1xv-db5AKhVUgioai6piRotqMeY3HVUxKY40g0SU-mRva0FQjXYS2_-Tr3QHd8rDqrGohfeic2SGQaqZ9wCYcwJi2NcGuStT6jxbnpQm3ftYo79FYhbhRETbpT5OiHZ8b_QPcXUotIMAKJRJssYOZMFmfo9sWd74ma-vZ8L48aMBA_1uBEcdUfpvCetcDoVrA';
    if (crop.includes('mango')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2TN4EIfixUskA3yAekTJS727z7Nl1SFUqCAcouR12aDr6q5Rtppp2JloVQ6c5f8oOHUslVtum5hVxRWKX4Jnse0cvjScOp3jkdxYEocoWNYodegXu2PbDbNwMSF16BSRD5T7hleMfJDzpAcU171ZontGkOQPQlMDnd8yvXUFz-2Ceztce-Gzc_N__jN8skM5KlFGwBRg906AJSyix7A0MTj4gPau7YZVoREZ3Ow_iZjulAFgHxkgPAA';
    if (crop.includes('onion')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-saHKB_S9w-WLH5LnriuMFiYUAR6kbyr075OniNXYx27rHKqHxvhPUg2mf5Z8eJb6C88jAXPXgHeJUfYp8pGb01jmCteMhWIlsOBG8GoazqbIzmGRWZpzFKRbtazRB7jPBQ1iWrh_jlcNYrUMrgzNJ98z197MlgiIU0-N-xp6Asvrl_FJ1AeFD-Ye2jsGYiFQFIkk2i7VR_dGwECNyRt1SKrr0S4mL_HT7k0bYZWwZRMSMwbf_xOeNQ';
    if (crop.includes('potato')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2TN4EIfixUskA3yAekTJS727z7Nl1SFUqCAcouR12aDr6q5Rtppp2JloVQ6c5f8oOHUslVtum5hVxRWKX4Jnse0cvjScOp3jkdxYEocoWNYodegXu2PbDbNwMSF16BSRD5T7hleMfJDzpAcU171ZontGkOQPQlMDnd8yvXUFz-2Ceztce-Gzc_N__jN8skM5KlFGwBRg906AJSyix7A0MTj4gPau7YZVoREZ3Ow_iZjulAFgHxkgPAA';
    return DEFAULT_CROP_THUMB;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#00431D" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('batches_title', 'Crop Batches')}</Text>
            <Text style={styles.headerSubtitle}>{t('batches_sub', 'Track your current and previous crops')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => navigation?.navigate('Profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="person" size={20} color="#145C2E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#145C2E" />
        }
      >
        {/* Summary Row (3 Metrics) */}
        <FadeIn delay={50} duration={MotionTokens.duration.standard} direction="down" reducedMotion={reducedMotion}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {dashboard?.by_status?.find(s => s.current_status === 'ACTIVE')?.batch_count ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>{t('active_batches', 'Active Batches')}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {dashboard?.by_status?.find(s => s.current_status === 'SOLD')?.batch_count ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>{t('batch_status_sold', 'Completed')}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {dashboard?.totals?.total_weight_kg ? Math.round(dashboard.totals.total_weight_kg) : 0}
              <Text style={styles.unitText}>kg</Text>
            </Text>
            <Text style={styles.summaryLabel}>{t('card_potential_rev', 'Total Weight')}</Text>
          </View>
        </View>
        </FadeIn>

        {/* Filter Pills */}
        <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={reducedMotion}>
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'active' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('active')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'active' && styles.filterPillTextActive,
              ]}
            >
              {t('batch_status_active', 'Active')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'completed' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('completed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'completed' && styles.filterPillTextActive,
              ]}
            >
              {t('batch_status_sold', 'Sold / Completed')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              {t('filter_all', 'All Batches')}
            </Text>
          </TouchableOpacity>
        </View>
        </FadeIn>

        {/* Loading State */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#145C2E" />
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#707A6F', marginTop: 12 }}>Loading batches...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <ScaleIn delay={150} duration={MotionTokens.duration.standard} reducedMotion={reducedMotion}>
          <View style={[styles.batchCard, { alignItems: 'center', padding: 30 }]}>
            <MaterialIcons name="error-outline" size={40} color="#F57F17" />
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#707A6F', marginTop: 12 }}>{error}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#145C2E', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}
              onPress={() => fetchData()}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>Retry</Text>
            </TouchableOpacity>
          </View>
          </ScaleIn>
        )}

        {/* Active Batch Cards */}
        {!loading && !error && (
          <View style={styles.batchesList}>
            {batches.map((batch: Batch, index) => (
              <ScaleIn key={batch.batch_id} delay={150 + index * 50} duration={MotionTokens.duration.standard} reducedMotion={reducedMotion}>
              <View style={styles.batchCard}>
                <View style={{ flexDirection: 'row', gap: 6, position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                  {batch.fungal_pathogen_presence && (
                    <View style={[styles.needsAttentionPill, { backgroundColor: '#FFEBEE' }]}>
                      <MaterialIcons name="warning" size={14} color="#C62828" />
                      <Text style={[styles.needsAttentionText, { color: '#C62828' }]}>Pathogen Alert</Text>
                    </View>
                  )}
                  {batch.current_status === 'ACTIVE' ? (
                    <View style={styles.healthyPill}>
                      <MaterialIcons name="check-circle" size={14} color="#005323" />
                      <Text style={styles.healthyText}>Active</Text>
                    </View>
                  ) : (
                    <View style={styles.needsAttentionPill}>
                      <MaterialIcons name="info" size={14} color="#F57F17" />
                      <Text style={styles.needsAttentionText}>{batch.current_status}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.batchHeaderRow}>
                  <Image source={{ uri: getCropThumbnail(batch.field_id) }} style={styles.cropThumb} resizeMode="cover" />
                  <View style={styles.batchInfoCol}>
                    <Text style={styles.cropNameTitle}>{batch.field_id || 'Unknown Field'}</Text>
                    <View style={styles.locationRow}>
                      <MaterialIcons name="location-on" size={16} color="#404940" />
                      <Text style={styles.locationText}>{batch.batch_id || 'N/A'} · {batch.initial_weight_kg || 0} kg</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.batchStatsBox}>
                  <View>
                    <Text style={styles.statSuperLabel}>VISUAL SCORE</Text>
                    <Text style={styles.statMainVal}>{batch.initial_visual_score || 0}%</Text>
                  </View>
                  <View>
                    <Text style={styles.statSuperLabel}>STATUS</Text>
                    <Text style={styles.statSubVal}>{batch.current_status || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text style={styles.statSuperLabel}>RIPENESS</Text>
                    <Text style={styles.statSubVal}>{batch.detected_ripeness_stage || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.batchActionsRow}>
                  <TouchableOpacity
                    style={styles.viewCropButton}
                    onPress={() => navigation?.navigate('CropDetails', { batchId: batch.batch_id, crop: batch.field_id || 'Crop', field: batch.field_id || 'Field' })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewCropText}>{t('view_passport', 'View Details')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scanIconButton, { backgroundColor: '#E8F5E9', borderColor: '#A7F3D0', borderWidth: 1 }]}
                    onPress={() => setSelectedPassportBatch(batch)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="picture-as-pdf" size={20} color="#145C2E" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scanIconButton}
                    onPress={() => navigation?.navigate('Scan', { batchId: batch.batch_id, cropType: batch.field_id })}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="qr-code-scanner" size={20} color="#145C2E" />
                  </TouchableOpacity>
                </View>
              </View>
              </ScaleIn>
            ))}

            {batches.length === 0 && !loading && (
              <ScaleIn delay={200} duration={MotionTokens.duration.standard} reducedMotion={reducedMotion}>
              <View style={[styles.batchCard, { alignItems: 'center', padding: 30 }]}>
                <MaterialIcons name="inventory-2" size={40} color="#C0C9BD" />
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#707A6F', marginTop: 12 }}>No batches found</Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#707A6F', marginTop: 4 }}>Add your first crop to get started</Text>
              </View>
              </ScaleIn>
            )}

            {/* Dashed Add Crop Action */}
            <ScaleIn delay={250} duration={MotionTokens.duration.standard} reducedMotion={reducedMotion}>
            <TouchableOpacity
              style={styles.dashedAddButton}
              onPress={() => navigation?.navigate('AddCrop')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={22} color="#00431D" />
              <Text style={styles.dashedAddText}>{t('action_add_crop', 'Add Crop')}</Text>
            </TouchableOpacity>
            </ScaleIn>
          </View>
        )}
      </ScrollView>

      {/* Quality Passport PDF Certificate Modal */}
      {selectedPassportBatch && (
        <QualityPassportModal
          visible={selectedPassportBatch !== null}
          onClose={() => setSelectedPassportBatch(null)}
          batchId={selectedPassportBatch.batch_id}
          cropType={selectedPassportBatch.field_id}
          weightKg={selectedPassportBatch.initial_weight_kg}
          visualScore={selectedPassportBatch.initial_visual_score}
          gradeTier={selectedPassportBatch.initial_visual_score >= 80 ? 'GRADE-A PRIME' : 'GRADE-B STANDARD'}
          qrToken={selectedPassportBatch.qr_code_secure_token || `BID:${selectedPassportBatch.batch_id}|CRP:${selectedPassportBatch.field_id}|WGT:${selectedPassportBatch.initial_weight_kg}`}
        />
      )}
    </SafeAreaView>
  );
}

export default withErrorBoundary(CropBatchesScreen, 'Crop Batches');

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  summaryNumber: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#00431D',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#404940',
  },
  summaryLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#404940',
    marginTop: 4,
    textAlign: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#707A6F',
  },
  filterPillActive: {
    backgroundColor: '#145C2E',
    borderColor: '#145C2E',
  },
  filterPillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#404940',
  },
  filterPillTextActive: {
    color: '#8CD298',
  },
  batchesList: {
    gap: 16,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    position: 'relative',
  },
  needsAttentionPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  needsAttentionText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#F57F17',
    textTransform: 'uppercase',
  },
  healthyPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#CCEAD0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthyText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#005323',
    textTransform: 'uppercase',
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cropThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ECE8DF',
  },
  batchInfoCol: {
    flex: 1,
    paddingRight: 60,
  },
  cropNameTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#00431D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  batchStatsBox: {
    backgroundColor: '#FEF9F0',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statSuperLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#707A6F',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statMainVal: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#00431D',
  },
  statSubVal: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#1D1C16',
  },
  batchActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewCropButton: {
    flex: 1,
    backgroundColor: '#145C2E',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCropFullButton: {
    backgroundColor: '#145C2E',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCropText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#8CD298',
  },
  scanIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedAddButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C0C9BD',
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  dashedAddText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#00431D',
  },
});
