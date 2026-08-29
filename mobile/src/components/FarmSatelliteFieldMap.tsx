import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticMedium } from '../utils/haptics';

export interface FieldParcel {
  id: string;
  name: string;
  crop: string;
  acreage: number;
  coordinates: { latitude: number; longitude: number }[];
  color?: string;
}

export interface SensorNode {
  id: string;
  nodeName: string;
  latitude: number;
  longitude: number;
  status: 'linked' | 'unlinked';
  batteryPct: number;
  signalTier: 'high' | 'low';
  soilMoisturePct: number;
  soilTempC: number;
}

interface FarmSatelliteFieldMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  height?: number;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  onSaveParcel?: (parcel: FieldParcel) => void;
}

const DEFAULT_PARCELS = (centerLat: number, centerLng: number): FieldParcel[] => [
  {
    id: 'field-1',
    name: 'East Field (Tomato Roma)',
    crop: 'Tomato',
    acreage: 3.4,
    color: '#D97706',
    coordinates: [
      { latitude: centerLat + 0.0028, longitude: centerLng - 0.0035 },
      { latitude: centerLat + 0.0032, longitude: centerLng - 0.0018 },
      { latitude: centerLat + 0.0016, longitude: centerLng - 0.0012 },
      { latitude: centerLat + 0.0012, longitude: centerLng - 0.0028 },
    ],
  },
  {
    id: 'field-2',
    name: 'North Parcel (Red Onion)',
    crop: 'Red Onion',
    acreage: 4.1,
    color: '#D97706',
    coordinates: [
      { latitude: centerLat + 0.0030, longitude: centerLng + 0.0008 },
      { latitude: centerLat + 0.0036, longitude: centerLng + 0.0028 },
      { latitude: centerLat + 0.0022, longitude: centerLng + 0.0034 },
      { latitude: centerLat + 0.0018, longitude: centerLng + 0.0012 },
    ],
  },
  {
    id: 'field-3',
    name: 'South Basin (Paddy Basmati)',
    crop: 'Paddy',
    acreage: 2.9,
    color: '#D97706',
    coordinates: [
      { latitude: centerLat - 0.0002, longitude: centerLng - 0.0042 },
      { latitude: centerLat - 0.0001, longitude: centerLng - 0.0020 },
      { latitude: centerLat - 0.0024, longitude: centerLng - 0.0028 },
      { latitude: centerLat - 0.0020, longitude: centerLng - 0.0046 },
    ],
  },
  {
    id: 'field-4',
    name: 'Central Orchard (Mango)',
    crop: 'Mango',
    acreage: 2.1,
    color: '#D97706',
    coordinates: [
      { latitude: centerLat - 0.0004, longitude: centerLng - 0.0015 },
      { latitude: centerLat + 0.0002, longitude: centerLng + 0.0018 },
      { latitude: centerLat - 0.0018, longitude: centerLng + 0.0012 },
      { latitude: centerLat - 0.0022, longitude: centerLng - 0.0010 },
    ],
  },
  {
    id: 'field-5',
    name: 'South-East Plot (Wheat)',
    crop: 'Wheat',
    acreage: 3.8,
    color: '#D97706',
    coordinates: [
      { latitude: centerLat - 0.0008, longitude: centerLng + 0.0022 },
      { latitude: centerLat - 0.0006, longitude: centerLng + 0.0044 },
      { latitude: centerLat - 0.0026, longitude: centerLng + 0.0038 },
      { latitude: centerLat - 0.0028, longitude: centerLng + 0.0018 },
    ],
  },
];

const DEFAULT_SENSORS = (centerLat: number, centerLng: number): SensorNode[] => [
  { id: 'S-01', nodeName: 'Node #01 (East Gate)', latitude: centerLat + 0.0024, longitude: centerLng - 0.0024, status: 'linked', batteryPct: 92, signalTier: 'high', soilMoisturePct: 42, soilTempC: 24.5 },
  { id: 'S-02', nodeName: 'Node #02 (East Soil)', latitude: centerLat + 0.0019, longitude: centerLng - 0.0022, status: 'linked', batteryPct: 85, signalTier: 'high', soilMoisturePct: 39, soilTempC: 25.1 },
  { id: 'S-03', nodeName: 'Node #03 (North Field)', latitude: centerLat + 0.0026, longitude: centerLng + 0.0020, status: 'linked', batteryPct: 78, signalTier: 'high', soilMoisturePct: 44, soilTempC: 23.8 },
  { id: 'S-04', nodeName: 'Node #04 (Central Hub)', latitude: centerLat - 0.0001, longitude: centerLng - 0.0012, status: 'linked', batteryPct: 95, signalTier: 'high', soilMoisturePct: 40, soilTempC: 24.2 },
  { id: 'S-05', nodeName: 'Node #05 (South Paddy)', latitude: centerLat - 0.0012, longitude: centerLng - 0.0036, status: 'linked', batteryPct: 62, signalTier: 'high', soilMoisturePct: 48, soilTempC: 22.9 },
  { id: 'S-06', nodeName: 'Node #06 (South-East Plot)', latitude: centerLat - 0.0018, longitude: centerLng + 0.0028, status: 'linked', batteryPct: 81, signalTier: 'high', soilMoisturePct: 37, soilTempC: 25.6 },
  { id: 'S-07', nodeName: 'Node #07 (Orchard Border)', latitude: centerLat - 0.0019, longitude: centerLng - 0.0004, status: 'linked', batteryPct: 45, signalTier: 'high', soilMoisturePct: 41, soilTempC: 24.7 },
  { id: 'S-08', nodeName: 'Node #08 (Well Station)', latitude: centerLat + 0.0012, longitude: centerLng - 0.0002, status: 'unlinked', batteryPct: 22, signalTier: 'low', soilMoisturePct: 33, soilTempC: 26.2 },
  { id: 'S-09', nodeName: 'Node #09 (Canal Sensor)', latitude: centerLat - 0.0010, longitude: centerLng + 0.0048, status: 'unlinked', batteryPct: 18, signalTier: 'low', soilMoisturePct: 52, soilTempC: 21.8 },
  { id: 'S-10', nodeName: 'Node #10 (Boundary Post)', latitude: centerLat - 0.0016, longitude: centerLng + 0.0046, status: 'unlinked', batteryPct: 27, signalTier: 'high', soilMoisturePct: 35, soilTempC: 25.9 },
  { id: 'S-11', nodeName: 'Node #11 (West Tree Line)', latitude: centerLat - 0.0004, longitude: centerLng - 0.0048, status: 'linked', batteryPct: 89, signalTier: 'high', soilMoisturePct: 43, soilTempC: 23.4 },
  { id: 'S-12', nodeName: 'Node #12 (Storage Shed)', latitude: centerLat + 0.0008, longitude: centerLng - 0.0014, status: 'linked', batteryPct: 94, signalTier: 'high', soilMoisturePct: 38, soilTempC: 24.8 },
  { id: 'S-13', nodeName: 'Node #13 (Rain Gauge)', latitude: centerLat - 0.0028, longitude: centerLng - 0.0022, status: 'linked', batteryPct: 76, signalTier: 'high', soilMoisturePct: 45, soilTempC: 23.1 },
  { id: 'S-14', nodeName: 'Node #14 (Weather Post)', latitude: centerLat - 0.0029, longitude: centerLng - 0.0016, status: 'linked', batteryPct: 83, signalTier: 'high', soilMoisturePct: 40, soilTempC: 24.0 },
];

function buildSatelliteHTML(
  centerLat: number,
  centerLng: number,
  parcels: FieldParcel[],
  sensors: SensorNode[]
): string {
  const parcelsJS = parcels
    .map(
      (p) => `
        L.polygon([
          ${p.coordinates.map((c) => `[${c.latitude}, ${c.longitude}]`).join(', ')}
        ], {
          color: '${p.color || '#E89A3C'}',
          weight: 2.5,
          fillColor: '#F59E0B',
          fillOpacity: 0.38,
          lineJoin: 'round'
        }).bindPopup('<b>🌾 ${p.name}</b><br>Crop: ${p.crop}<br>Area: ${p.acreage} Acres').addTo(map);
      `
    )
    .join('\n');

  const sensorsJS = sensors
    .map(
      (s) => `
        var sIcon = L.divIcon({
          className: 'sensor-marker',
          html: '<div class="sensor-chip-wrap ${s.status}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14]
        });

        L.marker([${s.latitude}, ${s.longitude}], { icon: sIcon })
          .bindPopup('<b>📡 ${s.nodeName}</b><br>Status: <span style="color:${s.status === 'linked' ? '#2563EB' : '#EA580C'}; font-weight:bold">${s.status.toUpperCase()}</span><br>Soil Moisture: <b>${s.soilMoisturePct}%</b><br>Soil Temp: <b>${s.soilTempC}°C</b><br>Battery: <b>${s.batteryPct}%</b><br>Signal: <b>${s.signalTier.toUpperCase()}</b>')
          .addTo(map);
      `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #1B2E1D; }
    .sensor-marker { background: none !important; border: none !important; }
    .sensor-chip-wrap {
      width: 28px;
      height: 28px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.45);
      border: 2px solid #FFFFFF;
      transition: transform 0.2s;
    }
    .sensor-chip-wrap.linked {
      background: #FFFFFF;
      color: #1E40AF;
      border-color: #3B82F6;
    }
    .sensor-chip-wrap.unlinked {
      background: #FFFFFF;
      color: #EA580C;
      border-color: #FB923C;
    }
    .sensor-chip-wrap:hover { transform: scale(1.18); }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${centerLat}, ${centerLng}],
      zoom: 16.5,
      zoomControl: false,
      attributionControl: false
    });

    // ArcGIS High-Resolution Satellite Imagery Layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri Satellite'
    }).addTo(map);

    ${parcelsJS}
    ${sensorsJS}

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
    window.resetCenter = function(lat, lng) { map.setView([lat, lng], 16.5); };
  </script>
</body>
</html>`;
}

export function FarmSatelliteFieldMap({
  initialLatitude = 19.9975,
  initialLongitude = 73.7898,
  height = 360,
  onCoordinatesChange,
  onSaveParcel,
}: FarmSatelliteFieldMapProps) {
  const [lat, setLat] = useState(initialLatitude);
  const [lng, setLng] = useState(initialLongitude);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [coordModalVisible, setCoordModalVisible] = useState(false);
  const [inputLat, setInputLat] = useState(String(initialLatitude));
  const [inputLng, setInputLng] = useState(String(initialLongitude));

  const [parcels] = useState<FieldParcel[]>(DEFAULT_PARCELS(initialLatitude, initialLongitude));
  const [sensors] = useState<SensorNode[]>(DEFAULT_SENSORS(initialLatitude, initialLongitude));

  const webViewRef = useRef<WebView | null>(null);

  const handleApplyCoordinates = () => {
    hapticMedium();
    const pLat = parseFloat(inputLat);
    const pLng = parseFloat(inputLng);
    if (!isNaN(pLat) && !isNaN(pLng)) {
      setLat(pLat);
      setLng(pLng);
      setCoordModalVisible(false);
      onCoordinatesChange?.({ lat: pLat, lng: pLng });
      if (Platform.OS === 'web') {
        const iframe = document.querySelector('iframe');
        if (iframe && (iframe as any).contentWindow?.resetCenter) {
          (iframe as any).contentWindow.resetCenter(pLat, pLng);
        }
      } else {
        webViewRef.current?.injectJavaScript(`window.resetCenter(${pLat}, ${pLng}); true;`);
      }
    }
  };

  const handleZoomIn = () => {
    hapticLight();
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe as any).contentWindow?.zoomIn) (iframe as any).contentWindow.zoomIn();
    } else {
      webViewRef.current?.injectJavaScript('window.zoomIn(); true;');
    }
  };

  const handleZoomOut = () => {
    hapticLight();
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe as any).contentWindow?.zoomOut) (iframe as any).contentWindow.zoomOut();
    } else {
      webViewRef.current?.injectJavaScript('window.zoomOut(); true;');
    }
  };

  const handleResetCenter = () => {
    hapticMedium();
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe as any).contentWindow?.resetCenter) (iframe as any).contentWindow.resetCenter(lat, lng);
    } else {
      webViewRef.current?.injectJavaScript(`window.resetCenter(${lat}, ${lng}); true;`);
    }
  };

  const linkedCount = sensors.filter((s) => s.status === 'linked').length;
  const unlinkedCount = sensors.filter((s) => s.status === 'unlinked').length;

  return (
    <View style={[styles.container, { height }]}>
      {/* Interactive Map WebView */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={buildSatelliteHTML(lat, lng, parcels, sensors)}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Satellite Farm Field Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: buildSatelliteHTML(lat, lng, parcels, sensors) }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
        />
      )}

      {/* Top Left: "+ Add Field / Set GPS" Button */}
      <TouchableOpacity
        style={styles.addFieldBtn}
        onPress={() => {
          hapticLight();
          setCoordModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.addFieldText}>Add Field / GPS</Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Top Right: Collapsible "Quick Summary" Telemetry Card */}
      <View style={styles.quickSummaryCard}>
        <TouchableOpacity
          style={styles.quickSummaryHeader}
          onPress={() => {
            hapticLight();
            setSummaryExpanded(!summaryExpanded);
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={summaryExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={18}
            color="#1F2937"
          />
          <Text style={styles.quickSummaryTitle}>Quick Summary</Text>
        </TouchableOpacity>

        {summaryExpanded && (
          <View style={styles.quickSummaryBody}>
            {/* 1. Devices Status */}
            <View style={styles.summarySection}>
              <Text style={styles.metricLabel}>Devices Status</Text>
              <View style={styles.multiBar}>
                <View style={[styles.barSegment, { flex: unlinkedCount, backgroundColor: '#EA580C' }]} />
                <View style={[styles.barSegment, { flex: linkedCount, backgroundColor: '#1E40AF' }]} />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#EA580C' }]} />
                  <Text style={styles.legendText}>Unlinked: {unlinkedCount}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#1E40AF' }]} />
                  <Text style={styles.legendText}>Linked: {linkedCount}</Text>
                </View>
              </View>
            </View>

            {/* 2. Signal */}
            <View style={styles.summarySection}>
              <Text style={styles.metricLabel}>Signal</Text>
              <View style={styles.multiBar}>
                <View style={[styles.barSegment, { flex: 2, backgroundColor: '#EF4444' }]} />
                <View style={[styles.barSegment, { flex: 11, backgroundColor: '#22C55E' }]} />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Low: 2</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.legendText}>High: 11</Text>
                </View>
              </View>
            </View>

            {/* 3. Battery */}
            <View style={styles.summarySection}>
              <Text style={styles.metricLabel}>Battery</Text>
              <View style={styles.multiBar}>
                <View style={[styles.barSegment, { flex: 2, backgroundColor: '#EF4444' }]} />
                <View style={[styles.barSegment, { flex: 8, backgroundColor: '#F59E0B' }]} />
                <View style={[styles.barSegment, { flex: 4, backgroundColor: '#22C55E' }]} />
              </View>
              <View style={styles.legendRowWrap}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>&lt;29%: 2</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>30-59%: 8</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#22C55E' }]} />
                  <Text style={styles.legendText}>60-100%: 4</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Right: Map Zoom & Center Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleZoomIn} activeOpacity={0.8}>
          <MaterialIcons name="add" size={20} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleZoomOut} activeOpacity={0.8}>
          <MaterialIcons name="remove" size={20} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleResetCenter} activeOpacity={0.8}>
          <MaterialIcons name="refresh" size={18} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Coordinate & Field Parcel Modal */}
      <Modal
        visible={coordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCoordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Set Farm Coordinates & Field</Text>
              <TouchableOpacity onPress={() => setCoordModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Center satellite imagery and delineate farm parcels based on your exact latitude and longitude coordinates.
            </Text>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Latitude (e.g. 19.9975° N)</Text>
              <TextInput
                style={styles.textInput}
                value={inputLat}
                onChangeText={setInputLat}
                keyboardType="numeric"
                placeholder="19.9975"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Longitude (e.g. 73.7898° E)</Text>
              <TextInput
                style={styles.textInput}
                value={inputLng}
                onChangeText={setInputLng}
                keyboardType="numeric"
                placeholder="73.7898"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyCoordinates}
              activeOpacity={0.85}
            >
              <MaterialIcons name="my-location" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Update Satellite Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1B2E1D',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadows.card,
  },
  webView: {
    flex: 1,
    backgroundColor: '#1B2E1D',
  },
  addFieldBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    zIndex: 20,
    ...Shadows.card,
  },
  addFieldText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickSummaryCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 14,
    padding: 10,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadows.card,
  },
  quickSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickSummaryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  quickSummaryBody: {
    marginTop: 8,
    gap: 8,
  },
  summarySection: {
    gap: 3,
  },
  metricLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#374151',
  },
  multiBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  legendRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendBox: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  legendText: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#4B5563',
  },
  mapControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    gap: 6,
    zIndex: 20,
  },
  mapControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Shadows.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    ...Shadows.modal,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  inputBlock: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#145C2E',
    borderRadius: 14,
    paddingVertical: 11,
    marginTop: 6,
  },
  applyBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
