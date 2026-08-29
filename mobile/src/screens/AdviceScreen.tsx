import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getDashboard } from '../services/api';
import { withErrorBoundary } from '../components/ErrorBoundary';

// ─── Types ───────────────────────────────────────────────
interface DashboardData {
  totals: {
    batch_count: number;
    total_weight_kg: number;
    avg_visual_score: number;
  };
  by_status: Array<{ current_status: string; batch_count: number; total_weight_kg: number }>;
  by_risk_tier: Array<{ risk_tier: string; batch_count: number; total_weight_kg: number }>;
  by_crop_category: Array<{ crop_category: string; batch_count: number; total_weight_kg: number }>;
  pathogen_alerts: number;
  recent_batches: Array<{
    batch_id: string;
    initial_weight_kg: number;
    harvest_timestamp: string;
    detected_ripeness_stage: string;
    current_status: string;
    initial_visual_score: number;
  }>;
}

interface AdviceItem {
  icon: string;
  title: string;
  desc: string;
  color: string;
  priority: number;
}

// ─── Dynamic Advice Generator ────────────────────────────
function generateAdvice(data: DashboardData): AdviceItem[] {
  const advice: AdviceItem[] = [];

  if (data.pathogen_alerts > 0) {
    advice.push({
      icon: '🚨',
      title: `${data.pathogen_alerts} Fungal Pathogen Alert${data.pathogen_alerts > 1 ? 's' : ''}`,
      desc: `${data.pathogen_alerts} batch${data.pathogen_alerts > 1 ? 'es have' : ' has'} detected fungal rot. Isolate immediately and consider bio-fuel processing.`,
      color: '#FFEBEE',
      priority: 0,
    });
  }

  const highRisk = data.by_risk_tier.find((r) => r.risk_tier === 'HIGH');
  if (highRisk && highRisk.batch_count > 0) {
    advice.push({
      icon: '🔴',
      title: `${highRisk.batch_count} High-Risk Batches`,
      desc: `${highRisk.batch_count} batch${highRisk.batch_count > 1 ? 'es have' : ' has'} visual score below 50. Sell locally within 24 hours to minimize losses.`,
      color: '#FFEBEE',
      priority: 1,
    });
  }

  if (data.totals.avg_visual_score < 60 && data.totals.batch_count > 0) {
    advice.push({
      icon: '⚠️',
      title: 'Below-Average Crop Quality',
      desc: `Average visual score is ${data.totals.avg_visual_score}/100. Improve handling during harvest — avoid mechanical damage and direct sun exposure.`,
      color: '#FFF8E1',
      priority: 2,
    });
  }

  if (data.totals.avg_visual_score >= 75 && data.totals.batch_count > 0) {
    advice.push({
      icon: '✅',
      title: 'Strong Crop Quality',
      desc: `Average visual score: ${data.totals.avg_visual_score}/100. Batches are in good condition — consider transport to higher-price mandis.`,
      color: '#E8F5E9',
      priority: 3,
    });
  }

  const inTransit = data.by_status.find((s) => s.current_status === 'TRANSIT');
  if (inTransit && inTransit.batch_count > 0) {
    advice.push({
      icon: '🚛',
      title: `${inTransit.batch_count} Batch${inTransit.batch_count > 1 ? 'es' : ''} In Transit`,
      desc: `${inTransit.total_weight_kg.toFixed(0)} kg being transported. Monitor environmental logs for temperature spikes above 30°C.`,
      color: '#E3F2FD',
      priority: 4,
    });
  }

  const active = data.by_status.find((s) => s.current_status === 'ACTIVE');
  if (active && active.batch_count > 0) {
    advice.push({
      icon: '📦',
      title: `${active.batch_count} Active Batches Pending`,
      desc: `${active.total_weight_kg.toFixed(0)} kg of harvest waiting. Evaluate routing options to maximize net profit margins.`,
      color: '#E8F5E9',
      priority: 5,
    });
  }

  const spoiled = data.by_status.find((s) => s.current_status === 'SPOILED');
  if (spoiled && spoiled.batch_count > 0) {
    advice.push({
      icon: '💀',
      title: `${spoiled.batch_count} Spoiled Batch${spoiled.batch_count > 1 ? 'es' : ''}`,
      desc: `${spoiled.total_weight_kg.toFixed(0)} kg lost to spoilage. Review cold storage and transport ventilation for future batches.`,
      color: '#FFEBEE',
      priority: 6,
    });
  }

  const cropAdvice: Record<string, { icon: string; tip: string }> = {
    Tomatoes: { icon: '🍅', tip: 'Store at 12-15°C. Separate overripe from optimal to reduce ethylene cross-contamination.' },
    Mangoes: { icon: '🥭', tip: 'Handle with care — mangoes bruise easily. Use padded crates and avoid stacking above 3 layers.' },
    Onions: { icon: '🧅', tip: 'Onions need dry, ventilated storage. Keep away from moisture to prevent sprouting.' },
    Other: { icon: '🌾', tip: 'Check market prices daily and plan transport routes to minimize transit time.' },
  };

  for (const crop of data.by_crop_category) {
    const tip = cropAdvice[crop.crop_category] || cropAdvice['Other'];
    if (crop.batch_count > 0) {
      advice.push({
        icon: tip.icon,
        title: `${crop.crop_category} — ${crop.batch_count} Batch${crop.batch_count > 1 ? 'es' : ''} (${crop.total_weight_kg.toFixed(0)} kg)`,
        desc: tip.tip,
        color: '#E8F5E9',
        priority: 7,
      });
    }
  }

  if (advice.length < 3) {
    advice.push(
      {
        icon: '⏰',
        title: 'Best Harvest Window',
        desc: 'Harvest between 6-8 AM when temperatures are cool to maximize shelf life.',
        color: '#E8F5E9',
        priority: 8,
      },
      {
        icon: '🌡️',
        title: 'Temperature Monitoring',
        desc: 'Keep storage below 15°C. Every 10°C above doubles decay rate (Q₁₀ = 2.2 for tomatoes).',
        color: '#E3F2FD',
        priority: 9,
      }
    );
  }

  return advice.sort((a, b) => a.priority - b.priority);
}

// ─── Main Component ──────────────────────────────────────
function AdviceScreen({ navigation }: any) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [advice, setAdvice] = useState<AdviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboard();
      setDashboard(data);
      setAdvice(generateAdvice(data));
    } catch (err: any) {
      console.warn('Dashboard fetch failed, using fallback advice:', err.message);
      setError(err.message || 'Could not load dashboard data');
      setAdvice([
        {
          icon: '⏰',
          title: 'Best time to harvest',
          desc: 'Harvest between 6-8 AM when temperatures are cool',
          color: '#E8F5E9',
          priority: 0,
        },
        {
          icon: '📦',
          title: 'Storage techniques',
          desc: 'Keep in shaded, ventilated area at 12-15°C',
          color: '#E3F2FD',
          priority: 1,
        },
        {
          icon: '🚛',
          title: 'Transport safety tips',
          desc: 'Use padded crates, avoid stacking above 3 layers',
          color: '#FFF8E1',
          priority: 2,
        },
        {
          icon: '🌡️',
          title: 'Temperature awareness',
          desc: 'Every 10°C above optimal doubles decay rate (Q₁₀ kinetics)',
          color: '#E8F5E9',
          priority: 3,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Advice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00431D" />
        }
      >
        {/* Dashboard Stats */}
        {dashboard && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.totals.batch_count}</Text>
              <Text style={styles.statLabel}>Total Batches</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dashboard.totals.total_weight_kg.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Weight (kg)</Text>
            </View>
            <View style={styles.statCard}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      dashboard.totals.avg_visual_score >= 70 ? '#145C2E' : '#E8A317',
                  },
                ]}
              >
                {dashboard.totals.avg_visual_score}
              </Text>
              <Text style={styles.statLabel}>Avg Quality Score</Text>
            </View>
          </View>
        )}

        {loading && !refreshing && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#145C2E" />
            <Text style={styles.centerStateText}>Loading advice...</Text>
          </View>
        )}

        {error && !dashboard && (
          <View style={styles.infoBanner}>
            <MaterialIcons name="info-outline" size={20} color="#1976D2" />
            <Text style={styles.infoText}>
              Database not connected — showing general farming tips. Connect to backend for
              personalized advice.
            </Text>
          </View>
        )}

        {/* Advice Cards */}
        {advice.map((item: AdviceItem, i: number) => (
          <View key={i} style={[styles.adviceCard, { backgroundColor: item.color }]}>
            <Text style={styles.adviceIcon}>{item.icon}</Text>
            <View style={styles.adviceText}>
              <Text style={styles.adviceTitle}>{item.title}</Text>
              <Text style={styles.adviceDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Recent Batches */}
        {dashboard && dashboard.recent_batches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {dashboard.recent_batches.slice(0, 5).map((batch: any, i: number) => (
              <View key={i} style={styles.batchCard}>
                <View style={styles.batchRow}>
                  <Text style={styles.batchId}>{batch.batch_id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      batch.current_status === 'ACTIVE' && styles.statusActive,
                      batch.current_status === 'TRANSIT' && styles.statusTransit,
                      batch.current_status === 'SOLD' && styles.statusSold,
                      batch.current_status === 'SPOILED' && styles.statusSpoiled,
                    ]}
                  >
                    <Text style={styles.statusText}>{batch.current_status}</Text>
                  </View>
                </View>
                <View style={styles.batchDetails}>
                  <Text style={styles.batchDetail}>{batch.initial_weight_kg} kg</Text>
                  <Text style={styles.batchDetail}>•</Text>
                  <Text style={styles.batchDetail}>{batch.detected_ripeness_stage}</Text>
                  <Text style={styles.batchDetail}>•</Text>
                  <Text
                    style={[
                      styles.batchDetail,
                      {
                        color:
                          batch.initial_visual_score >= 70 ? '#145C2E' : '#E8A317',
                      },
                    ]}
                  >
                    Score: {batch.initial_visual_score}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Refresh */}
        <TouchableOpacity style={styles.refreshButton} onPress={fetchData} activeOpacity={0.85}>
          <Text style={styles.refreshButtonText}>Refresh Advice</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(AdviceScreen, 'Advice');

// ─── Styles ──────────────────────────────────────────────
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
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#00431D',
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    color: '#404940',
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  centerStateText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#707A6F',
    marginTop: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
    flex: 1,
  },
  adviceCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  adviceIcon: { fontSize: 28 },
  adviceText: { flex: 1, gap: 4 },
  adviceTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1D1C16',
  },
  adviceDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    color: '#1D1C16',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  batchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchId: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#1D1C16',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F0F0F0',
  },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusTransit: { backgroundColor: '#E3F2FD' },
  statusSold: { backgroundColor: '#E8F5E9' },
  statusSpoiled: { backgroundColor: '#FFEBEE' },
  statusText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: '#404940',
  },
  batchDetails: { flexDirection: 'row', gap: 6 },
  batchDetail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#707A6F',
  },
  refreshButton: {
    backgroundColor: '#145C2E',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  refreshButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
