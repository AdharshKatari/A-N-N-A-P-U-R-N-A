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
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { simulateWhatIf, WhatIfResponse } from '../services/api';
import { withErrorBoundary } from '../components/ErrorBoundary';
import TextShimmer from '../components/TextShimmer';
import AnimatedNumber from '../components/AnimatedNumber';

function WhatIfScreen({ navigation, route }: any) {
  const crop = route?.params?.crop || 'Paddy';
  const field = route?.params?.field || 'East Field';
  const [data, setData] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (e) {}

      const result = await simulateWhatIf({
        crop_type: crop,
        quantity_kg: 500,
        visual_score: 65,
        ambient_temp_c: 28,
        latitude: lat,
        longitude: lng,
        ethylene_multiplier: 1.0,
      });
      setData(result);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('Missing Authorization')) {
        setError('Please log in to use Smart Move features.');
      } else {
        setError('Failed to load scenarios. Please try again.');
      }
      console.error('WhatIf fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [crop]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scenarios = data?.scenarios || [];

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
        <Text style={styles.headerTitle}>Compare Futures</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerInfoSection}>
          <Text style={styles.fieldSuperText}>{crop.toUpperCase()} • {field.toUpperCase()}</Text>
          <Text style={styles.infoDesc}>
            Compare what may happen with each option to make an informed decision.
          </Text>
        </View>

        {loading && (
          <View style={styles.generatingCard}>
            <ActivityIndicator size="small" color="#145C2E" />
            <TextShimmer style={styles.generatingText} duration={900}>
              Generating future scenarios...
            </TextShimmer>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={[styles.standardCard, { alignItems: 'center', padding: 30 }]}>
            <MaterialIcons name="error-outline" size={40} color="#F57F17" />
            <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#707A6F', marginTop: 12 }}>{error}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#145C2E', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}
              onPress={() => {
                if (error?.includes('log in')) {
                  navigation?.navigate('Login');
                } else {
                  fetchData();
                }
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>{error?.includes('log in') ? 'Go to Login' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comparison Stacked Cards */}
        {!loading && !error && (
        <View style={styles.cardsStack}>
          {scenarios.map((scenario: any, index: number) => {
            const riskColor = scenario.risk_level === 'LOW' ? '#145C2E'
              : scenario.risk_level === 'MEDIUM' ? '#E8A317' : '#D14343';
            const riskBackground = scenario.risk_level === 'LOW' ? '#E8F4E6'
              : scenario.risk_level === 'MEDIUM' ? '#FEF9E7' : '#FEF0F0';
            const rating = scenario.risk_level === 'LOW' ? 5 : scenario.risk_level === 'MEDIUM' ? 4 : 3;
            return (
            <View key={scenario.id || `option-${index}`} style={[
              styles.scoreCard,
              { borderColor: `${riskColor}33`, backgroundColor: scenario.is_recommended ? '#F5FBF3' : '#FFFFFF' },
            ]}>
              <View pointerEvents="none" style={[styles.patternStripe, { backgroundColor: `${riskColor}10` }]} />
              {scenario.is_recommended && (
                <View style={styles.recommendedCornerBadge}>
                  <MaterialIcons name="star" size={14} color="#FFFFFF" />
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
              )}

              <View style={[styles.platformBadge, { backgroundColor: riskBackground, borderColor: `${riskColor}55` }]}>
                <MaterialIcons name={scenario.id === 'sell_local' ? 'storefront'
                  : scenario.id === 'transport_distant' ? 'local-shipping'
                  : scenario.id === 'store_overnight' ? 'inventory-2' : 'factory'} size={20} color={riskColor} />
                <View>
                  <Text style={[styles.platformName, { color: riskColor }]}>{scenario.title}</Text>
                  <Text style={styles.platformSublabel}>FUTURE OUTCOME</Text>
                </View>
              </View>

              <View style={styles.heroMetric}>
                <Text style={styles.currency}>₹</Text>
                <AnimatedNumber
                  value={Number(scenario.estimated_price_per_kg) || 0}
                  decimals={1}
                  useGrouping={false}
                  style={styles.metricHero}
                />
                <Text style={styles.metricSuffix}>/kg</Text>
              </View>
              <View style={styles.profitRow}>
                <AnimatedNumber
                  value={Math.round(scenario.expected_net_profit_inr) || 0}
                  prefix="₹"
                  style={styles.outcomeTitle}
                />
                <Text style={styles.profitLabel}> estimated net profit</Text>
              </View>
              <Text style={styles.outcomeDescription}>{scenario.subtitle}</Text>

              <View style={styles.detailRow}>
                <View style={styles.detailCell}>
                  <Text style={styles.detailLabel}>SHELF LIFE</Text>
                  <Text style={styles.detailValue}>{scenario.shelf_life_remaining_days?.toFixed(1)} days</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailCell}>
                  <Text style={styles.detailLabel}>RISK LEVEL</Text>
                  <Text style={[styles.detailValue, { color: riskColor }]}>{scenario.risk_level}</Text>
                </View>
              </View>

              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <MaterialIcons key={starIndex} name="star" size={17} color={starIndex < rating ? riskColor : '#E2E4DF'} />
                ))}
                <Text style={styles.ratingLabel}>Outcome confidence</Text>
              </View>
            </View>
          );})}
        </View>
        )}

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryPillButton}
            onPress={() => navigation?.navigate('Recommendation')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryPillButtonText}>View Best Recommendation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryPillButton}
            onPress={() => navigation?.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryPillButtonText}>Back to Smart Move</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(WhatIfScreen, 'What If');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF9F0',
  },
  header: {
    backgroundColor: '#FEF9F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  headerInfoSection: {
    gap: 4,
  },
  fieldSuperText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#404940',
    textTransform: 'uppercase',
  },
  infoDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#1D1C16',
  },
  cardsStack: {
    gap: 16,
  },
  generatingCard: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8E5DD',
    backgroundColor: '#FFFFFF',
  },
  generatingText: {
    fontSize: 14,
  },
  scoreCard: {
    minHeight: 360,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  patternStripe: {
    position: 'absolute',
    width: 180,
    height: 360,
    right: -105,
    top: -70,
    transform: [{ rotate: '25deg' }],
  },
  platformBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 22,
  },
  platformName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
  },
  platformSublabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: '#707A6F',
    marginTop: 1,
  },
  heroMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    color: '#1D1C16',
    marginRight: 2,
  },
  metricHero: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 52,
    lineHeight: 62,
    letterSpacing: -2,
    color: '#1D1C16',
  },
  metricSuffix: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 18,
    color: '#707A6F',
    marginLeft: 2,
  },
  outcomeTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#1D1C16',
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  profitLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#1D1C16',
  },
  outcomeDescription: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#707A6F',
    marginTop: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(245,243,237,0.72)',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },
  detailCell: { flex: 1, gap: 3 },
  detailDivider: { width: 1, backgroundColor: '#E1DED5', marginHorizontal: 12 },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#8A8F87',
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#1D1C16',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 18,
  },
  ratingLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: '#8A8F87',
    marginLeft: 6,
  },
  recommendedCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#145C2E',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedCornerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#00431D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  standardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.6)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#1D1C16',
  },
  cardTitleGreen: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#00431D',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 16,
  },
  metricItem: {
    width: '45%',
    gap: 2,
  },
  metricLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: '#404940',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#1D1C16',
  },
  lowRiskBadge: {
    backgroundColor: '#F5F3ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  lowRiskText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#145C2E',
  },
  mediumRiskBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  mediumRiskText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#925C00',
  },
  highRiskBadge: {
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  highRiskText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#93000A',
  },
  ctaContainer: {
    gap: 12,
    marginTop: 8,
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#145C2E',
  },
});
