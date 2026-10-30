import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticMedium } from '../utils/haptics';

export interface MarketHubNode {
  id: string;
  name: string;
  code: string;
  pricePerQtl: number;
  dailyCapacityKg: number;
  efficiencyPct: number;
  distanceKm: number;
  color: string;
  latitude: number;
  longitude: number;
  isOrigin?: boolean;
}

export interface CyberMarketRouteMapProps {
  originLat?: number;
  originLng?: number;
  selectedCrop?: string;
  height?: number;
  style?: ViewStyle;
  onSelectHub?: (hub: MarketHubNode) => void;
}

const DEFAULT_HUBS = (originLat: number, originLng: number): MarketHubNode[] => [
  {
    id: 'origin',
    name: 'Nashik Farm Origin',
    code: 'FARM-72201',
    pricePerQtl: 2400,
    dailyCapacityKg: 3320,
    efficiencyPct: 85,
    distanceKm: 0,
    color: '#F59E0B',
    latitude: originLat,
    longitude: originLng,
    isOrigin: true,
  },
  {
    id: 'vashi',
    name: 'Vashi Navi Mumbai (Terminal)',
    code: 'VSH-94102',
    pricePerQtl: 3400,
    dailyCapacityKg: 17464,
    efficiencyPct: 74,
    distanceKm: 168,
    color: '#00F0FF',
    latitude: 19.0748,
    longitude: 72.9978,
  },
  {
    id: 'pimpalgaon',
    name: 'Pimpalgaon APMC Hub',
    code: 'PMP-46207',
    pricePerQtl: 2800,
    dailyCapacityKg: 2195,
    efficiencyPct: 79,
    distanceKm: 32,
    color: '#3B82F6',
    latitude: 20.1697,
    longitude: 73.9875,
  },
  {
    id: 'pune',
    name: 'Pune Gultekdi Mandi',
    code: 'PUN-87112',
    pricePerQtl: 3150,
    dailyCapacityKg: 1432,
    efficiencyPct: 92,
    distanceKm: 210,
    color: '#145C2E',
    latitude: 18.4975,
    longitude: 73.8652,
  },
  {
    id: 'nashik-local',
    name: 'Nashik City Mandi',
    code: 'NSK-53708',
    pricePerQtl: 2650,
    dailyCapacityKg: 4200,
    efficiencyPct: 88,
    distanceKm: 12,
    color: '#8B5CF6',
    latitude: 19.9975,
    longitude: 73.7898,
  },
];

function buildCyberHTML(
  originLat: number,
  originLng: number,
  hubs: MarketHubNode[],
  activeHubId: string
): string {
  const activeHub = hubs.find((h) => h.id === activeHubId) || hubs[1];

  const routesJS = hubs
    .filter((h) => !h.isOrigin)
    .map((h) => {
      const isSelected = h.id === activeHub.id;
      // Realistic route waypoints between farm origin and hub
      const midLat = (originLat + h.latitude) / 2 + (h.longitude > originLng ? 0.08 : -0.08);
      const midLng = (originLng + h.longitude) / 2 + (h.latitude > originLat ? -0.05 : 0.05);

      return `
        var routePts_${h.id} = [
          [${originLat}, ${originLng}],
          [${midLat}, ${midLng}],
          [${h.latitude}, ${h.longitude}]
        ];

        // Outer Neon Glow Layer
        L.polyline(routePts_${h.id}, {
          color: '${h.color}',
          weight: ${isSelected ? 10 : 5},
          opacity: ${isSelected ? 0.45 : 0.22},
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Core Glowing Polyline
        L.polyline(routePts_${h.id}, {
          color: '${h.color}',
          weight: ${isSelected ? 3.5 : 2},
          opacity: ${isSelected ? 1.0 : 0.75},
          dashArray: '${isSelected ? 'none' : '6, 6'}',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      `;
    })
    .join('\n');

  const hubsJS = hubs
    .map((h) => {
      const isSelected = h.id === activeHub.id;
      return `
        // Glowing Radar Shield Dome
        L.circle([${h.latitude}, ${h.longitude}], {
          radius: ${h.isOrigin ? 6000 : isSelected ? 18000 : 12000},
          color: '${h.color}',
          weight: 1.5,
          opacity: 0.8,
          fillColor: '${h.color}',
          fillOpacity: ${isSelected ? 0.16 : 0.08}
        }).addTo(map);

        // Cyber Hub Marker Pin
        var hubIcon_${h.id} = L.divIcon({
          className: 'cyber-marker',
          html: \`
            <div class="cyber-pin-pulse" style="border-color: ${h.color}"></div>
            <div class="cyber-pin-core" style="background: ${h.color}; box-shadow: 0 0 16px ${h.color}">
              <span class="cyber-icon">${h.isOrigin ? '⚡' : '🏬'}</span>
            </div>
            <div class="cyber-hud-card \${'${isSelected ? 'active-hud' : ''}'}">
              <div class="hud-stat-line">
                <span class="hud-highlight" style="color: ${h.color}">⚡ ${h.dailyCapacityKg.toLocaleString()}</span>
                <span class="hud-sub">kg/d</span>
                <span class="hud-right">\${'${h.efficiencyPct}'}% <small>Eff</small></span>
              </div>
              <div class="hud-name">${h.name}</div>
              <div class="hud-price-row">
                <span class="hud-price">₹${h.pricePerQtl.toLocaleString()}/qtl</span>
                <span class="hud-dist">${h.distanceKm > 0 ? h.distanceKm + ' km' : 'Origin'}</span>
              </div>
            </div>
          \`,
          iconSize: [160, 90],
          iconAnchor: [80, 45]
        });

        var m_${h.id} = L.marker([${h.latitude}, ${h.longitude}], { icon: hubIcon_${h.id} }).addTo(map);
        m_${h.id}.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select-hub', hubId: '${h.id}' }));
          }
        });
      `;
    })
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
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #060B12; }
    
    .cyber-marker {
      background: none !important;
      border: none !important;
      position: relative;
    }
    
    .cyber-pin-core {
      width: 22px;
      height: 22px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 34px;
      left: 69px;
      border: 2px solid #FFFFFF;
      z-index: 10;
    }
    
    .cyber-icon {
      font-size: 11px;
      line-height: 1;
    }
    
    .cyber-pin-pulse {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 2px solid #00F0FF;
      position: absolute;
      top: 23px;
      left: 58px;
      animation: cyberPulse 2.2s ease-out infinite;
      opacity: 0.6;
    }
    
    @keyframes cyberPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .cyber-hud-card {
      position: absolute;
      top: -38px;
      left: 10px;
      width: 140px;
      background: rgba(11, 19, 34, 0.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 6px 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.25s;
    }
    
    .cyber-hud-card.active-hud {
      background: rgba(14, 28, 50, 0.95);
      border-color: #00F0FF;
      box-shadow: 0 0 14px rgba(0, 240, 255, 0.35);
      transform: scale(1.05);
    }
    
    .hud-stat-line {
      display: flex;
      align-items: baseline;
      gap: 3px;
    }
    
    .hud-highlight {
      font-size: 11px;
      font-weight: 800;
      color: #00F0FF;
    }
    
    .hud-sub {
      font-size: 8px;
      color: #94A3B8;
    }
    
    .hud-right {
      margin-left: auto;
      font-size: 9px;
      font-weight: 700;
      color: #E2E8F0;
    }
    
    .hud-right small {
      font-size: 7px;
      color: #94A3B8;
    }
    
    .hud-name {
      font-size: 9px;
      font-weight: 600;
      color: #F8FAFC;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .hud-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .hud-price {
      font-size: 10px;
      font-weight: 700;
      color: #38BDF8;
    }
    
    .hud-dist {
      font-size: 8px;
      color: #94A3B8;
    }

    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${originLat + 0.15}, ${originLng + 0.15}],
      zoom: 8.8,
      zoomControl: false,
      attributionControl: false
    });

    // Dark-Matter Cartography Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: 'CartoDB'
    }).addTo(map);

    ${routesJS}
    ${hubsJS}

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
    window.focusHub = function(lat, lng) { map.flyTo([lat, lng], 10, { duration: 1.2 }); };
  </script>
</body>
</html>`;
}

export function CyberMarketRouteMap({
  originLat = 19.9975,
  originLng = 73.7898,
  selectedCrop = 'Tomato',
  height = 360,
  style,
  onSelectHub,
}: CyberMarketRouteMapProps) {
  const hubs = DEFAULT_HUBS(originLat, originLng);
  const [selectedHubId, setSelectedHubId] = useState<string>('vashi');
  const webViewRef = useRef<WebView | null>(null);

  const selectedHub = hubs.find((h) => h.id === selectedHubId) || hubs[1];

  const handleSelectHub = (hub: MarketHubNode) => {
    hapticMedium();
    setSelectedHubId(hub.id);
    onSelectHub?.(hub);
    if (Platform.OS === 'web') {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe as any).contentWindow?.focusHub) {
        (iframe as any).contentWindow.focusHub(hub.latitude, hub.longitude);
      }
    } else {
      webViewRef.current?.injectJavaScript(`window.focusHub(${hub.latitude}, ${hub.longitude}); true;`);
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

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Dark CartoDB Cybernetic Route Map */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={buildCyberHTML(originLat, originLng, hubs, selectedHubId)}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Cyber Market Network Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: buildCyberHTML(originLat, originLng, hubs, selectedHubId) }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          onMessage={(event: WebViewMessageEvent) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'select-hub') {
                const h = hubs.find((node) => node.id === data.hubId);
                if (h) handleSelectHub(h);
              }
            } catch {}
          }}
        />
      )}

      {/* Top Header Overlay: Live Crop & Corridor Index */}
      <View style={styles.topOverlayBar}>
        <View style={styles.badgePulse}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.badgePulseText}>CYBER HIGHWAY GRID</Text>
        </View>
        <Text style={styles.cropBadge}>{selectedCrop} • Route Arbitrage</Text>
      </View>

      {/* Right-Side Highway Corridor Code Rail (Matching User Reference) */}
      <View style={styles.rightCorridorRail}>
        <View style={styles.railHeader}>
          <MaterialIcons name="alt-route" size={12} color="#00F0FF" />
          <Text style={styles.railHeaderText}>CORRIDOR</Text>
        </View>
        {hubs.map((hub) => {
          const isSelected = hub.id === selectedHubId;
          return (
            <TouchableOpacity
              key={hub.id}
              style={[styles.railItem, isSelected && styles.railItemActive]}
              onPress={() => handleSelectHub(hub)}
              activeOpacity={0.8}
            >
              <View style={[styles.railDot, { backgroundColor: hub.color }]} />
              <Text style={[styles.railCode, isSelected && styles.railCodeActive]}>
                {hub.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Floating Hub Status KPI Bar */}
      <View style={styles.bottomStatusOverlay}>
        <View style={styles.statusCol}>
          <Text style={styles.statusLabel}>TARGET MANDI</Text>
          <Text style={styles.statusValue} numberOfLines={1}>{selectedHub.name}</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusCol}>
          <Text style={styles.statusLabel}>MODAL PRICE</Text>
          <Text style={[styles.statusValue, { color: '#00F0FF' }]}>
            ₹{selectedHub.pricePerQtl.toLocaleString()}<Text style={styles.statusUnit}>/qtl</Text>
          </Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusCol}>
          <Text style={styles.statusLabel}>SURPLUS GAIN</Text>
          <Text style={[styles.statusValue, { color: '#145C2E' }]}>
            +{Math.round(((selectedHub.pricePerQtl - 2400) / 2400) * 100)}%
          </Text>
        </View>
      </View>

      {/* Map Zoom Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleZoomIn} activeOpacity={0.8}>
          <MaterialIcons name="add" size={18} color="#00F0FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlBtn} onPress={handleZoomOut} activeOpacity={0.8}>
          <MaterialIcons name="remove" size={18} color="#00F0FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#060B12',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    ...Shadows.card,
  },
  webView: {
    flex: 1,
    backgroundColor: '#060B12',
  },
  topOverlayBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  badgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
  },
  badgePulseText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    fontWeight: '800',
    color: '#00F0FF',
    letterSpacing: 0.5,
  },
  cropBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#F8FAFC',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rightCorridorRail: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 100,
    backgroundColor: 'rgba(11, 19, 34, 0.88)',
    borderRadius: 12,
    padding: 6,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  railHeaderText: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  railItemActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  railDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  railCode: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: '#94A3B8',
  },
  railCodeActive: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  bottomStatusOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 54,
    backgroundColor: 'rgba(11, 19, 34, 0.92)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    zIndex: 20,
  },
  statusCol: {
    flex: 1,
  },
  statusLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#64748B',
    letterSpacing: 0.4,
  },
  statusValue: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 1,
  },
  statusUnit: {
    fontSize: 9,
    color: '#94A3B8',
  },
  statusDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
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
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    ...Shadows.card,
  },
});
