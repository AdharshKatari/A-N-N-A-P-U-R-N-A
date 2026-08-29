import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticMedium, hapticSelection } from '../utils/haptics';

export interface FieldZone {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  lastUpdated: string;
  stressIndex: number;
  stressLevel: 'Low' | 'Medium' | 'High';
  stressDesc: string;
  soilMoistureKpa: number;
  waterSupplyKpa: number;
  tempC: number;
  soilPh: number;
  alertText: string;
  alertImage: string;
  coords: { lat: number; lng: number };
}

export interface PrecisionDashboardProps {
  farmName?: string;
  location?: string;
  totalAcreageHa?: number;
  initialLatitude?: number;
  initialLongitude?: number;
  style?: ViewStyle;
}

const DEFAULT_FIELDS: FieldZone[] = [
  {
    id: 'f-3',
    name: 'Field 3 - Corn & Tomato',
    crop: 'Corn & Tomato',
    areaHa: 12.8,
    lastUpdated: '07:45 AM',
    stressIndex: 39,
    stressLevel: 'Medium',
    stressDesc: 'Moderate stress detected in this field, primarily related to water availability in southern quadrant.',
    soilMoistureKpa: 42,
    waterSupplyKpa: 42,
    tempC: 32,
    soilPh: 5.8,
    alertText: 'Water stress in zones. Level at 26.7% - irrigation urgently needed.',
    alertImage: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300&q=80',
    coords: { lat: 19.9985, lng: 73.7885 },
  },
  {
    id: 'f-4',
    name: 'Field 4 - Soybean',
    crop: 'Soybean',
    areaHa: 26.5,
    lastUpdated: '08:15 AM',
    stressIndex: 18,
    stressLevel: 'Low',
    stressDesc: 'Optimal vegetative stage. Chlorophyll absorption is uniform across all rows.',
    soilMoistureKpa: 48,
    waterSupplyKpa: 55,
    tempC: 28,
    soilPh: 6.4,
    alertText: 'Soil moisture is optimal at 48 kPa. Growth rate is on target.',
    alertImage: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=300&q=80',
    coords: { lat: 20.0020, lng: 73.7940 },
  },
  {
    id: 'f-5',
    name: 'Field 5 - Wheat & Paddy',
    crop: 'Wheat',
    areaHa: 30.0,
    lastUpdated: '06:30 AM',
    stressIndex: 24,
    stressLevel: 'Low',
    stressDesc: 'Stable tillering stage. Nitrogen absorption efficiency index at 92%.',
    soilMoistureKpa: 45,
    waterSupplyKpa: 50,
    tempC: 27,
    soilPh: 6.2,
    alertText: 'Scheduled scheduled foliar spray recommended for Tuesday.',
    alertImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&q=80',
    coords: { lat: 20.0010, lng: 73.7840 },
  },
];

function buildPrecisionSatelliteHTML(
  centerLat: number,
  centerLng: number,
  selectedFieldId: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #0E1A0F; }
    .field-tag-pin {
      background: none !important;
      border: none !important;
    }
    .field-tag-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(14, 26, 15, 0.85);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 4px 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      cursor: pointer;
      transition: all 0.2s;
    }
    .field-tag-badge.active {
      border-color: #F59E0B;
      background: rgba(217, 119, 6, 0.85);
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
      transform: scale(1.08);
    }
    .field-tag-title { font-size: 10px; font-weight: 800; }
    .field-tag-sub { font-size: 8px; opacity: 0.8; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${centerLat}, ${centerLng}],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // High-Res Satellite Layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri Satellite'
    }).addTo(map);

    // Field 3 Polygon (Active Field with Heatmap Stress Zones)
    var p3 = L.polygon([
      [${centerLat + 0.0012}, ${centerLng - 0.0028}],
      [${centerLat + 0.0024}, ${centerLng - 0.0010}],
      [${centerLat - 0.0014}, ${centerLng - 0.0004}],
      [${centerLat - 0.0020}, ${centerLng - 0.0024}]
    ], {
      color: '#FACC15',
      weight: 3,
      dashArray: '4, 4',
      fillColor: '#84CC16',
      fillOpacity: 0.35
    }).addTo(map);

    // Thermal Stress Hotspot Circle on Field 3
    L.circle([${centerLat + 0.0004}, ${centerLng - 0.0014}], {
      radius: 48,
      color: '#EF4444',
      weight: 1,
      fillColor: '#EF4444',
      fillOpacity: 0.65
    }).addTo(map);

    L.circle([${centerLat - 0.0008}, ${centerLng - 0.0012}], {
      radius: 36,
      color: '#F97316',
      weight: 1,
      fillColor: '#F97316',
      fillOpacity: 0.60
    }).addTo(map);

    // Field 4 Polygon (Soybean)
    L.polygon([
      [${centerLat + 0.0034}, ${centerLng + 0.0014}],
      [${centerLat + 0.0042}, ${centerLng + 0.0038}],
      [${centerLat + 0.0018}, ${centerLng + 0.0044}],
      [${centerLat + 0.0012}, ${centerLng + 0.0018}]
    ], {
      color: '#84CC16',
      weight: 2,
      fillColor: '#4D7C0F',
      fillOpacity: 0.30
    }).addTo(map);

    // Field 5 Polygon (Wheat)
    L.polygon([
      [${centerLat + 0.0038}, ${centerLng - 0.0046}],
      [${centerLat + 0.0044}, ${centerLng - 0.0024}],
      [${centerLat + 0.0022}, ${centerLng - 0.0028}],
      [${centerLat + 0.0018}, ${centerLng - 0.0050}]
    ], {
      color: '#EAB308',
      weight: 2,
      fillColor: '#CA8A04',
      fillOpacity: 0.30
    }).addTo(map);

    // Marker Pins
    var createTag = function(title, sub, isActive) {
      return L.divIcon({
        className: 'field-tag-pin',
        html: '<div class="field-tag-badge ' + (isActive ? 'active' : '') + '"><span>🌾</span><span class="field-tag-title">' + title + '</span><span class="field-tag-sub">' + sub + '</span></div>',
        iconSize: [80, 40],
        iconAnchor: [40, 20]
      });
    };

    L.marker([${centerLat + 0.0002}, ${centerLng - 0.0015}], { icon: createTag('Field 3', 'Corn (12.8 ha)', ${selectedFieldId === 'f-3'}) }).addTo(map);
    L.marker([${centerLat + 0.0026}, ${centerLng + 0.0028}], { icon: createTag('Field 4', 'Soybean (26.5 ha)', ${selectedFieldId === 'f-4'}) }).addTo(map);
    L.marker([${centerLat + 0.0030}, ${centerLng - 0.0036}], { icon: createTag('Field 5', 'Wheat (30.0 ha)', ${selectedFieldId === 'f-5'}) }).addTo(map);
  </script>
</body>
</html>`;
}

export function PrecisionAgriCommandDashboard({
  farmName = 'Annapurna Smart Farms',
  location = 'Nashik Agricultural Belt, Maharashtra',
  totalAcreageHa = 112.5,
  initialLatitude = 19.9975,
  initialLongitude = 73.7898,
  style,
}: PrecisionDashboardProps) {
  const [selectedField, setSelectedField] = useState<FieldZone>(DEFAULT_FIELDS[0]);
  const [fieldCardVisible, setFieldCardVisible] = useState<boolean>(true);

  // Checkbox task states
  const [tasks, setTasks] = useState([
    { id: 't-1', title: 'Irrigation - North Field', time: '08:00 AM', completed: true },
    { id: 't-2', title: 'Pesticide Application - Corn', time: '10:30 AM', completed: false },
    { id: 't-3', title: 'Soil Analysis - East Valley', time: '02:00 PM', completed: false },
  ]);

  const toggleTask = (id: string) => {
    hapticLight();
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <View style={[styles.mainContainer, style]}>
      {/* 1. Aerial Satellite Map Viewport */}
      <View style={styles.mapViewport}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={buildPrecisionSatelliteHTML(initialLatitude, initialLongitude, selectedField.id)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Precision Aerial Farm View"
          />
        ) : (
          <WebView
            source={{ html: buildPrecisionSatelliteHTML(initialLatitude, initialLongitude, selectedField.id) }}
            style={styles.mapWebView}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
          />
        )}

        {/* Top Header Tag Overlay */}
        <View style={styles.mapTopHeader}>
          <View style={styles.farmTitleBadge}>
            <MaterialIcons name="eco" size={16} color="#4ADE80" />
            <View>
              <Text style={styles.farmTitleText}>{farmName}</Text>
              <Text style={styles.farmSubText}>{location} • 6 active parcels</Text>
            </View>
          </View>
        </View>

        {/* Floating "Field Details & Stress Index" Glass HUD Card (Left Side) */}
        {fieldCardVisible && (
          <View style={styles.fieldGlassCard}>
            <View style={styles.fieldCardHeader}>
              <View>
                <Text style={styles.fieldCardTitle}>{selectedField.name}</Text>
                <Text style={styles.fieldCardSub}>
                  {selectedField.areaHa} ha • Last updated {selectedField.lastUpdated}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeCardBtn}
                onPress={() => {
                  hapticLight();
                  setFieldCardVisible(false);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Crop Stress Index Gradient Bar */}
            <View style={styles.stressBarSection}>
              <View style={styles.stressLineHeader}>
                <Text style={styles.stressLabel}>Crop Stress Index</Text>
                <Text style={styles.stressVal}>
                  {selectedField.stressIndex}{' '}
                  <Text style={styles.stressSubVal}>({selectedField.stressLevel})</Text>
                </Text>
              </View>
              <View style={styles.gradientBarWrap}>
                <View style={styles.gradientBarTrack}>
                  <View style={[styles.gradientBarFill, { width: `${selectedField.stressIndex}%` }]} />
                </View>
              </View>
              <Text style={styles.stressDescText}>{selectedField.stressDesc}</Text>
            </View>

            {/* 4 Telemetry Metrics Grid */}
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryCell}>
                <MaterialIcons name="water-drop" size={16} color="#38BDF8" />
                <View>
                  <Text style={styles.telemetryVal}>{selectedField.soilMoistureKpa} kPa</Text>
                  <Text style={styles.telemetrySub}>Soil Moisture</Text>
                </View>
              </View>
              <View style={styles.telemetryCell}>
                <MaterialIcons name="waves" size={16} color="#60A5FA" />
                <View>
                  <Text style={styles.telemetryVal}>{selectedField.waterSupplyKpa} kPa</Text>
                  <Text style={styles.telemetrySub}>Water Supply</Text>
                </View>
              </View>
              <View style={styles.telemetryCell}>
                <MaterialIcons name="device-thermostat" size={16} color="#F87171" />
                <View>
                  <Text style={styles.telemetryVal}>{selectedField.tempC} °C</Text>
                  <Text style={styles.telemetrySub}>Temperature</Text>
                </View>
              </View>
              <View style={styles.telemetryCell}>
                <MaterialIcons name="science" size={16} color="#FBBF24" />
                <View>
                  <Text style={styles.telemetryVal}>{selectedField.soilPh}</Text>
                  <Text style={styles.telemetrySub}>Soil pH</Text>
                </View>
              </View>
            </View>

            {/* Urgent Stress Alert Box */}
            <View style={styles.stressAlertCard}>
              <Image source={{ uri: selectedField.alertImage }} style={styles.alertThumb} />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertHeading}>Water stress in zones.</Text>
                <Text style={styles.alertBody}>Level at 26.7% - irrigation urgently needed.</Text>
              </View>
            </View>

            {/* Action Buttons: Snooze & Watering */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.snoozeBtn}
                onPress={() => hapticLight()}
                activeOpacity={0.8}
              >
                <MaterialIcons name="snooze" size={16} color="#94A3B8" />
                <Text style={styles.snoozeText}>Snooze</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wateringBtn}
                onPress={() => hapticMedium()}
                activeOpacity={0.85}
              >
                <MaterialIcons name="opacity" size={16} color="#FFFFFF" />
                <Text style={styles.wateringText}>Watering</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 2. Comprehensive Farm Telemetry & AI Command Dashboard (Bottom/Right Panel) */}
      <View style={styles.dashboardPanel}>
        {/* Daily Agronomic Condition Summary */}
        <View style={styles.summarySpeechCard}>
          <Text style={styles.summarySpeechText}>
            “Overall field conditions remain stable today. Soil moisture is slightly below optimal levels, while crop growth remains consistent across all active fields.”
          </Text>
        </View>

        {/* Scheduled Farm Tasks Checklist */}
        <View style={styles.tasksSection}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItemRow, task.completed && styles.taskItemCompleted]}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={task.completed ? 'check-box' : 'check-box-outline-blank'}
                size={18}
                color={task.completed ? '#22C55E' : '#94A3B8'}
              />
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
                {task.title}
              </Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2x2 Overview & Live Weather Grid */}
        <View style={styles.overviewGrid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridCardHeader}>Farm Overview</Text>
            <View style={styles.gridCardContent}>
              <View>
                <Text style={styles.gridBigNum}>{totalAcreageHa}</Text>
                <Text style={styles.gridUnit}>Hectares</Text>
              </View>
              <View style={styles.gridMiniCol}>
                <Text style={styles.gridMiniText}>Crop: <Text style={styles.gridMiniBold}>4 Types</Text></Text>
                <Text style={styles.gridMiniText}>Harvest: <Text style={styles.gridMiniBold}>2 Fields</Text></Text>
              </View>
            </View>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridCardHeader}>Weather</Text>
            <View style={styles.gridCardContent}>
              <View>
                <Text style={styles.gridBigNum}>28°</Text>
                <Text style={styles.gridUnit}>Partly Cloudy</Text>
              </View>
              <View style={styles.gridMiniCol}>
                <Text style={styles.gridMiniText}>💧 68%</Text>
                <Text style={styles.gridMiniText}>💨 15 km/h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Crop Distribution Breakdown Bar Chart */}
        <View style={styles.cropDistCard}>
          <Text style={styles.distHeader}>Crop Distribution</Text>
          <View style={styles.distRow}>
            <Text style={styles.distCropName}>Corn & Maize</Text>
            <View style={styles.distSegmentBar}>
              <View style={[styles.distFill, { flex: 36, backgroundColor: '#EAB308' }]} />
              <View style={[styles.distTrack, { flex: 64 }]} />
            </View>
            <Text style={styles.distAcreage}>36.0 ha</Text>
          </View>
          <View style={styles.distRow}>
            <Text style={styles.distCropName}>Wheat</Text>
            <View style={styles.distSegmentBar}>
              <View style={[styles.distFill, { flex: 30, backgroundColor: '#F59E0B' }]} />
              <View style={[styles.distTrack, { flex: 70 }]} />
            </View>
            <Text style={styles.distAcreage}>30.0 ha</Text>
          </View>
          <View style={styles.distRow}>
            <Text style={styles.distCropName}>Soybeans</Text>
            <View style={styles.distSegmentBar}>
              <View style={[styles.distFill, { flex: 26, backgroundColor: '#84CC16' }]} />
              <View style={[styles.distTrack, { flex: 74 }]} />
            </View>
            <Text style={styles.distAcreage}>26.5 ha</Text>
          </View>
          <View style={styles.distRow}>
            <Text style={styles.distCropName}>Red Chili / Tomato</Text>
            <View style={styles.distSegmentBar}>
              <View style={[styles.distFill, { flex: 20, backgroundColor: '#EF4444' }]} />
              <View style={[styles.distTrack, { flex: 80 }]} />
            </View>
            <Text style={styles.distAcreage}>20.0 ha</Text>
          </View>
        </View>

        {/* AI Agro-Vision Insights with Sample Images */}
        <View style={styles.aiInsightsCard}>
          <View style={styles.aiInsightsHeader}>
            <MaterialIcons name="auto-awesome" size={16} color="#A855F7" />
            <Text style={styles.aiInsightsTitle}>AI Agronomic Insights</Text>
          </View>
          <View style={styles.aiThumbsRow}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=160&q=80' }}
              style={styles.aiThumb}
            />
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=160&q=80' }}
              style={styles.aiThumb}
            />
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=160&q=80' }}
              style={styles.aiThumb}
            />
          </View>
          <Text style={styles.aiInsightBody}>
            Corn crop requires targeted pesticide application. Early-stage fall armyworm risk detected in southern perimeter.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    backgroundColor: '#0F1A11',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Shadows.modal,
  },
  mapViewport: {
    height: 380,
    position: 'relative',
    backgroundColor: '#08120A',
  },
  mapWebView: {
    flex: 1,
    backgroundColor: '#08120A',
  },
  mapTopHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
  },
  farmTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 26, 17, 0.94)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  farmTitleText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  farmSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#94A3B8',
  },
  fieldGlassCard: {
    position: 'absolute',
    top: 60,
    left: 12,
    width: 250,
    backgroundColor: 'rgba(15, 23, 17, 0.96)',
    borderRadius: 18,
    padding: 12,
    zIndex: 30,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    ...Shadows.modal,
    gap: 10,
  },
  fieldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fieldCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  fieldCardSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  closeCardBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressBarSection: {
    gap: 4,
  },
  stressLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stressLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#CBD5E1',
  },
  stressVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#F59E0B',
  },
  stressSubVal: {
    fontSize: 9,
    color: '#94A3B8',
  },
  gradientBarWrap: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gradientBarTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  gradientBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  stressDescText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
    marginTop: 2,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryCell: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#F8FAFC',
  },
  telemetrySub: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: '#94A3B8',
  },
  stressAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 6,
  },
  alertThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FBBF24',
  },
  alertBody: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#E2E8F0',
    lineHeight: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  snoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 7,
  },
  snoozeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#94A3B8',
  },
  wateringBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 7,
  },
  wateringText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  dashboardPanel: {
    padding: 14,
    backgroundColor: '#0A120B',
    gap: 12,
  },
  summarySpeechCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  summarySpeechText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  tasksSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  taskItemCompleted: {
    opacity: 0.65,
  },
  taskTitle: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#F8FAFC',
    marginLeft: 8,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskTime: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#94A3B8',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gridCardHeader: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
  },
  gridCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  gridBigNum: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  gridUnit: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#94A3B8',
  },
  gridMiniCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  gridMiniText: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#94A3B8',
  },
  gridMiniBold: {
    fontFamily: FontFamily.bold,
    color: '#CBD5E1',
  },
  cropDistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  distHeader: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#94A3B8',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distCropName: {
    width: 100,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#CBD5E1',
  },
  distSegmentBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
  },
  distTrack: {
    height: '100%',
  },
  distAcreage: {
    width: 45,
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
  },
  aiInsightsCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    gap: 8,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiInsightsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#C084FC',
  },
  aiThumbsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  aiThumb: {
    flex: 1,
    height: 48,
    borderRadius: 8,
  },
  aiInsightBody: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
  },
});
