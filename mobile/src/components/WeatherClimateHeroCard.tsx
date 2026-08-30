import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, BorderRadius, Shadows } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

interface WeatherClimateHeroCardProps {
  temp?: number;
  condition?: string;
  locationName?: string;
  humidity?: number;
  windSpeed?: number;
  rainChance?: number;
  onPressForecast?: () => void;
}

export default function WeatherClimateHeroCard({
  temp = 34,
  condition = 'Partly Sunny',
  locationName = 'Nashik Farm',
  humidity = 62,
  windSpeed = 14,
  rainChance = 15,
  onPressForecast,
}: WeatherClimateHeroCardProps) {
  // Determine appropriate weather icon and themes
  const condLower = condition.toLowerCase();
  let weatherIconName: keyof typeof MaterialIcons.glyphMap = 'wb-sunny';
  let iconColor = '#F59E0B';
  let bgGradient = '#FEF3C7';

  if (condLower.includes('cloud') || condLower.includes('overcast')) {
    weatherIconName = 'wb-cloudy';
    iconColor = '#0284C7';
    bgGradient = '#E0F2FE';
  } else if (condLower.includes('rain') || condLower.includes('shower') || condLower.includes('drizzle')) {
    weatherIconName = 'water-drop';
    iconColor = '#2563EB';
    bgGradient = '#DBEAFE';
  } else if (condLower.includes('thunder') || condLower.includes('storm')) {
    weatherIconName = 'flash-on';
    iconColor = '#7C3AED';
    bgGradient = '#EDE9FE';
  }

  // Thermal Degree-Hour Decay Assessment
  const isHighThermalStress = temp >= 32;
  const decayVelocityMultiplier = Math.pow(2.2, Math.max(0, temp - 12) / 10).toFixed(1);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => {
        hapticLight();
        onPressForecast?.();
      }}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="View full weather and satellite forecast"
    >
      {/* Top Header Row */}
      <View style={styles.topHeaderRow}>
        <View style={styles.headerLeftTag}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={16} color="#145C2E" />
          <Text style={styles.headerTagText}>LIVE FARM CLIMATE & DEGREE-HOURS</Text>
        </View>
        <View style={styles.locationPill}>
          <MaterialIcons name="place" size={13} color="#4B5563" />
          <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
        </View>
      </View>

      {/* Main Climate Hero Display */}
      <View style={styles.mainDisplayRow}>
        <View style={styles.tempLeftBlock}>
          <View style={styles.tempRow}>
            <Text style={styles.tempValue}>{Math.round(temp)}°</Text>
            <Text style={styles.tempUnit}>C</Text>
          </View>
          <Text style={styles.conditionText}>{condition}</Text>
          <View style={styles.thermalStressPill}>
            <View
              style={[
                styles.thermalDot,
                { backgroundColor: isHighThermalStress ? '#E53935' : '#145C2E' },
              ]}
            />
            <Text
              style={[
                styles.thermalStressText,
                { color: isHighThermalStress ? '#C62828' : '#145C2E' },
              ]}
            >
              {isHighThermalStress
                ? `High Heat (${decayVelocityMultiplier}x Decay Velocity)`
                : 'Optimal Cold Chain Safe'}
            </Text>
          </View>
        </View>

        {/* Visual Weather Cloud & Sun Graphic */}
        <View style={[styles.visualGraphicCircle, { backgroundColor: bgGradient }]}>
          <MaterialIcons name={weatherIconName} size={48} color={iconColor} />
          {condLower.includes('cloud') && (
            <View style={styles.sunSmallOverlay}>
              <MaterialIcons name="wb-sunny" size={22} color="#F59E0B" />
            </View>
          )}
        </View>
      </View>

      {/* 3-Metric Climate Parameter Bar */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <View style={styles.metricIconWrap}>
            <MaterialIcons name="water-drop" size={16} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Humidity</Text>
            <Text style={styles.metricValue}>{humidity}%</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricIconWrap}>
            <MaterialIcons name="air" size={16} color="#059669" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Wind</Text>
            <Text style={styles.metricValue}>{windSpeed} km/h</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricIconWrap}>
            <MaterialIcons name="umbrella" size={16} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Rain Chance</Text>
            <Text style={styles.metricValue}>{rainChance}%</Text>
          </View>
        </View>
      </View>

      {/* 5-Day Visual Mini Forecast Strip */}
      <View style={styles.forecastStripRow}>
        {[
          { day: 'Today', icon: weatherIconName, color: iconColor, temp: `${Math.round(temp)}°` },
          { day: 'Sun', icon: 'wb-sunny', color: '#F59E0B', temp: '33°' },
          { day: 'Mon', icon: 'wb-cloudy', color: '#0284C7', temp: '31°' },
          { day: 'Tue', icon: 'water-drop', color: '#2563EB', temp: '29°' },
          { day: 'Wed', icon: 'wb-sunny', color: '#F59E0B', temp: '34°' },
        ].map((item, idx) => (
          <View key={idx} style={[styles.miniDayCard, idx === 0 && styles.miniDayCardActive]}>
            <Text style={[styles.miniDayText, idx === 0 && styles.miniDayTextActive]}>
              {item.day}
            </Text>
            <MaterialIcons name={item.icon as any} size={18} color={item.color} style={{ marginVertical: 3 }} />
            <Text style={[styles.miniTempText, idx === 0 && styles.miniTempTextActive]}>
              {item.temp}
            </Text>
          </View>
        ))}
      </View>

      {/* Tap to View Full Satellite & Climate Analysis Button */}
      <View style={styles.viewFullBtnRow}>
        <Text style={styles.viewFullBtnText}>View ISRO Satellite Map & 7-Day Forecast</Text>
        <MaterialIcons name="arrow-forward" size={15} color="#145C2E" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.card,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerTagText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#145C2E',
    letterSpacing: 0.4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
    maxWidth: 110,
  },
  mainDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tempLeftBlock: {
    flex: 1,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tempValue: {
    fontSize: 38,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 42,
  },
  tempUnit: {
    fontSize: 20,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  conditionText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  thermalStressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thermalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thermalStressText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  visualGraphicCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.card,
  },
  sunSmallOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAF8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  forecastStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  miniDayCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  miniDayCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  miniDayText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  miniDayTextActive: {
    fontFamily: FontFamily.bold,
    color: '#145C2E',
    fontWeight: '700',
  },
  miniTempText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#374151',
  },
  miniTempTextActive: {
    color: '#145C2E',
  },
  viewFullBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewFullBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#145C2E',
  },
});
