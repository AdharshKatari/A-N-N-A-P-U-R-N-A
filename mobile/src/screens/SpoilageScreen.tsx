import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getBatch, getLogAnalytics, getWeatherAlerts, getNearbySalvage } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import type { MapMarker } from '../components/LeafletMap';
import { withErrorBoundary } from '../components/ErrorBoundary';

function SpoilageScreen({ navigation, route }: any) {
  const crop = route?.params?.crop || 'Paddy';
  const field = route?.params?.field || 'East Field';
  const batchId = route?.params?.batchId;

  const [batchData, setBatchData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({ latitude: 19.9975, longitude: 73.7898 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let lat = 19.9975, lng = 73.7898;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setUserCoords({ latitude: lat, longitude: lng });
        }
      } catch (e) {}

      const promises: Promise<any>[] = [
        getWeatherAlerts(lat, lng, crop),
      ];
      if (batchId) {
        promises.push(getBatch(batchId));
        promises.push(getLogAnalytics(batchId));
      }
      const results = await Promise.allSettled(promises);
      setWeatherAlerts(results[0].status === 'fulfilled' ? results[0].value?.alerts || [] : []);
      if (batchId && results.length > 1) {
        if (results[1].status === 'fulfilled') setBatchData(results[1].value?.batch);
        if (results[2]?.status === 'fulfilled') setAnalytics(results[2].value?.analytics);
      }

      // Fetch real nearby salvage/storage facilities
      const salvageRes = await getNearbySalvage(lat, lng, 50).catch(() => null);
      if (salvageRes?.facilities && salvageRes.facilities.length > 0) {
        setStorageFacilities(
          salvageRes.facilities.map((f: any, i: number) => ({
            id: `salvage-${i}`,
            latitude: f.latitude || lat,
            longitude: f.longitude || lng,
            title: f.name || f.facility_name || `Storage ${i + 1}`,
            subtitle: f.distance_km ? `${f.distance_km.toFixed(1)} km · ${f.status || 'Available'}` : f.type || 'Storage',
            color: f.type === 'COLD_STORAGE' ? '#1565C0' : f.type === 'PROCESSING' ? '#6D4C41' : '#00838F',
            icon: f.type === 'COLD_STORAGE' ? '❄️' : f.type === 'PROCESSING' ? '🏭' : '🏗️',
          }))
        );
      }
    } catch (err) {
      setError('Failed to load spoilage data. Please try again.');
      console.error('Spoilage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [crop, batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const spoilageRisk = analytics?.spoilage_risk || (batchData?.initial_visual_score && batchData.initial_visual_score < 50 ? 'HIGH' : batchData?.initial_visual_score && batchData.initial_visual_score < 70 ? 'MODERATE' : 'LOW');
  const riskLevel = spoilageRisk === 'HIGH' ? 'High' : spoilageRisk === 'MODERATE' ? 'Moderate' : 'Low';
  const riskColor = riskLevel === 'High' ? '#BA1A1A' : riskLevel === 'Moderate' ? '#F59E0B' : '#145C2E';

  // Nearby storage facilities from API (initialized empty, loaded on fetch)
  const [storageFacilities, setStorageFacilities] = useState<MapMarker[]>([]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>Spoilage Prediction</Text>
          <Text style={styles.headerSubtitle}>{crop} • {field}</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.lastAnalyzedText}>Last analyzed: Today, 10:45 AM</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#145C2E" />
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#707A6F', marginTop: 12 }}>Analyzing spoilage risk...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.primaryRiskCard, { alignItems: 'center', padding: 30 }]}>
            <MaterialIcons name="error-outline" size={40} color="#F57F17" />
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#707A6F', marginTop: 12 }}>{error}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#145C2E', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}
              onPress={fetchData}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Storage Facilities Map */}
        {!loading && !error && (
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <MaterialIcons name="warehouse" size={20} color="#00431D" />
            <Text style={styles.mapTitle}>Nearby Storage</Text>
            <View style={styles.facilityCountBadge}>
              <Text style={styles.facilityCountText}>{storageFacilities.length}</Text>
            </View>
          </View>
          <Text style={styles.mapSubtitle}>Quick access to storage before quality drops</Text>
          <LeafletMap
            latitude={userCoords.latitude}
            longitude={userCoords.longitude}
            zoom={13}
            markers={storageFacilities}
            showUserLocation={true}
            clusterMarkers
            height={200}
          />
        </View>
        )}

        {/* Primary Risk Card */}
        {!loading && !error && (
        <View style={styles.primaryRiskCard}>
          <View style={styles.riskTopRow}>
            <View style={styles.warningIconCircle}>
              <MaterialIcons name="warning" size={26} color={riskColor} />
            </View>
            <View style={styles.riskTextCol}>
              <Text style={[styles.riskTitle, { color: riskColor }]}>{riskLevel} Spoilage Risk</Text>
              <Text style={styles.riskDesc}>
                {analytics?.spoilage_risk || `Visual score: ${batchData?.initial_visual_score || 'N/A'}%. Quality may begin to reduce based on current conditions.`}
              </Text>
            </View>
          </View>

          {/* Risk Level Segmented Indicator */}
          <View style={styles.riskIndicatorContainer}>
            <View style={styles.riskLabelsRow}>
              <Text style={styles.riskLevelLabel}>Low</Text>
              <Text style={[styles.riskLevelLabel, riskLevel === 'Moderate' && styles.riskLevelLabelActive]}>Moderate</Text>
              <Text style={styles.riskLevelLabel}>High</Text>
            </View>
            <View style={styles.riskTrack}>
              <View style={[styles.riskTrackSegment, { backgroundColor: '#F5F3ED' }]} />
              <View style={[styles.riskTrackSegment, { backgroundColor: riskLevel === 'Moderate' ? '#F59E0B' : '#F2EDE4' }]} />
              <View style={[styles.riskTrackSegment, { backgroundColor: riskLevel === 'High' ? '#F59E0B' : '#F2EDE4' }]} />
            </View>
          </View>
        </View>
        )}

        {/* Key Factors Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>What is affecting the risk?</Text>

          <View style={styles.factorsList}>
            {/* Factor 1: Visual Score */}
            <View style={styles.factorCard}>
              <View style={[styles.factorIconCircle, { backgroundColor: batchData?.initial_visual_score && batchData.initial_visual_score < 50 ? '#FFDAD6' : '#F5F3ED' }]}>
                <MaterialCommunityIcons name="leaf" size={22} color={batchData?.initial_visual_score && batchData.initial_visual_score < 50 ? '#BA1A1A' : '#00431D'} />
              </View>
              <View>
                <Text style={styles.factorName}>Visual Score</Text>
                <Text style={[styles.factorStatus, { color: batchData?.initial_visual_score && batchData.initial_visual_score < 50 ? '#BA1A1A' : '#00431D' }]}>
                  {batchData?.initial_visual_score ? `${batchData.initial_visual_score}% - ${batchData.initial_visual_score < 50 ? 'Needs Attention' : 'Good Condition'}` : 'No scan data available'}
                </Text>
              </View>
            </View>

            {/* Factor 2: Temperature */}
            <View style={styles.factorCard}>
              <View style={[styles.factorIconCircle, { backgroundColor: analytics?.avg_temperature_c && analytics.avg_temperature_c > 30 ? '#FEF3C7' : '#F5F3ED' }]}>
                <MaterialIcons name="water-drop" size={22} color={analytics?.avg_temperature_c && analytics.avg_temperature_c > 30 ? '#F59E0B' : '#00431D'} />
              </View>
              <View>
                <Text style={styles.factorName}>Temperature</Text>
                <Text style={[styles.factorStatus, { color: analytics?.avg_temperature_c && analytics.avg_temperature_c > 30 ? '#D97706' : '#00431D' }]}>
                  {analytics?.avg_temperature_c ? `Avg ${analytics.avg_temperature_c}°C - ${analytics.avg_temperature_c > 30 ? 'High' : 'Stable'}` : 'No temperature data'}
                </Text>
              </View>
            </View>

            {/* Factor 3: Weather Alert */}
            {weatherAlerts.length > 0 && (
            <View style={styles.factorCard}>
              <View style={[styles.factorIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="cloud-queue" size={22} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.factorName}>Weather</Text>
                <Text style={[styles.factorStatus, { color: '#D97706' }]}>
                  {weatherAlerts[0].title} - {weatherAlerts[0].recommended_action}
                </Text>
              </View>
            </View>
            )}
          </View>
        </View>

        {/* Action Window Card */}
        <View style={styles.actionWindowCard}>
          <View>
            <Text style={styles.actionWindowSuper}>ACTION WINDOW</Text>
            <Text style={styles.actionWindowTitle}>Best action within 2–3 days</Text>
          </View>
          <MaterialIcons name="schedule" size={28} color="#00431D" />
        </View>

        {/* What Should You Do Card */}
        {!loading && !error && (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationBoxTitle}>What should you do now?</Text>
          <Text style={styles.recommendationBoxDesc}>
            Review selling, storing, or transporting options before quality drops. Early action can preserve market value.
          </Text>
        </View>
        )}

        {/* Impact Warning Note */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTextBold}>
            <Text style={{ fontWeight: '700' }}>If delayed: </Text>
            Possible quality and price reduction.
          </Text>
          <Text style={styles.impactTextMuted}>
            Estimated risk based on current crop condition. Conditions may change.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryPillButton}
            onPress={() => navigation?.navigate('SmartMove', { crop, field })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryPillButtonText}>VIEW SMART MOVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryPillButton}
            onPress={() => navigation?.navigate('Analysis')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryPillButtonText}>VIEW CURRENT CONDITION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(SpoilageScreen, 'Spoilage');

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
  headerTitleCenter: {
    alignItems: 'center',
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
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  lastAnalyzedText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#707A6F',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 20,
  },
  primaryRiskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  riskTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  warningIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskTextCol: {
    flex: 1,
    gap: 4,
  },
  riskTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    color: '#1D1C16',
  },
  riskDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#404940',
  },
  riskIndicatorContainer: {
    marginTop: 8,
  },
  riskLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  riskLevelLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#707A6F',
    textTransform: 'uppercase',
  },
  riskLevelLabelActive: {
    color: '#F59E0B',
  },
  riskTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2EDE4',
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  riskTrackSegment: {
    flex: 1,
    height: '100%',
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '600',
    color: '#00431D',
  },
  factorsList: {
    gap: 12,
  },
  factorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  factorIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1D1C16',
  },
  factorStatus: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
    marginTop: 2,
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 10,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#00431D',
  },
  facilityCountBadge: {
    backgroundColor: '#F5F3ED',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityCountText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#145C2E',
  },
  mapSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#707A6F',
  },
  actionWindowCard: {
    backgroundColor: '#F5F3ED',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionWindowSuper: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    color: '#145C2E',
    textTransform: 'uppercase',
  },
  actionWindowTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#00431D',
    marginTop: 2,
  },
  recommendationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 8,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  recommendationBoxTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#00431D',
  },
  recommendationBoxDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#404940',
  },
  impactCard: {
    backgroundColor: '#F2EDE4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  impactTextBold: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
    textAlign: 'center',
  },
  impactTextMuted: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#707A6F',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  ctaContainer: {
    gap: 12,
    marginTop: 4,
  },
  primaryPillButton: {
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
  },
  primaryPillButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  secondaryPillButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#145C2E',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPillButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#145C2E',
    textTransform: 'uppercase',
  },
});
