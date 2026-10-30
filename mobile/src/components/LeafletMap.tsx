/**
 * LeafletMap — OpenStreetMap + Leaflet.js map component for React Native
 *
 * Renders an interactive OpenStreetMap via WebView with Leaflet.js.
 * Supports markers, user location, and custom styling.
 */
import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  color?: string;     // hex color for marker, e.g. '#145C2E'
  icon?: string;      // emoji or text label
}

export interface MapRoute {
  /** Array of coordinates along the route */
  coordinates: { latitude: number; longitude: number }[];
  /** Stroke color as hex (default: '#145C2E') */
  color?: string;
  /** Stroke width in pixels (default: 4) */
  weight?: number;
  /** Opacity 0-1 (default: 0.8) */
  opacity?: number;
  /** Optional label shown in a popup on the route */
  label?: string;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  showUserLocation?: boolean;
  clusterMarkers?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
  onMarkerPress?: (markerId: string) => void;
  enableDrawing?: boolean;
  onPolygonComplete?: (polygon: { latitude: number; longitude: number }[]) => void;
}

function buildLeafletHTML(
  lat: number,
  lng: number,
  zoom: number,
  markers: MapMarker[],
  routes: MapRoute[],
  showUserLocation: boolean,
  clusterMarkers: boolean,
  enableDrawing: boolean,
): string {
  const markersJS = markers
    .map(
      (m) =>
        `{
          var marker = L.marker([${m.latitude}, ${m.longitude}], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div class="marker-pin" style="background:${m.color || '#145C2E'}"><span>${m.icon || '📍'}</span></div>',
              iconSize: [36, 44],
              iconAnchor: [18, 44],
              popupAnchor: [0, -46],
            })
          }).bindPopup('<b>${m.title.replace(/'/g, "\\'")}</b>${m.subtitle ? '<br>' + m.subtitle.replace(/'/g, "\\'") : ''}');
          marker.on('click', function() {
            postToRN({ type: 'marker-click', markerId: '${m.id}' });
          });
          ${clusterMarkers ? 'markers.addLayer(marker);' : 'marker.addTo(map);'}
        }`,
    )
    .join('\n      ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #E8E8E8; }
    #map { position: absolute; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; }

    .custom-marker {
      background: none !important;
      border: none !important;
    }
    .marker-pin {
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      position: relative;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      border: 2px solid white;
    }
    .marker-pin span {
      transform: rotate(45deg);
      font-size: 16px;
      line-height: 1;
    }

    .user-location-dot {
      width: 16px;
      height: 16px;
      background: #4285F4;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.2);
    }
    .user-location-pulse {
      width: 40px;
      height: 40px;
      background: rgba(66,133,244,0.15);
      border-radius: 50%;
      position: absolute;
      top: -12px;
      left: -12px;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.5); opacity: 0.2; }
    }

    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      color: #145C2E !important;
      background: white !important;
      border-bottom: 1px solid #E8E8E8 !important;
    }
    .leaflet-control-zoom a:last-child {
      border-bottom: none !important;
    }
    .leaflet-control-attribution {
      display: none !important;
    }

    /* Custom cluster styles */
    .marker-cluster-small {
      background-color: rgba(20, 92, 46, 0.7);
    }
    .marker-cluster-small div {
      background-color: rgba(20, 92, 46, 0.7);
    }
    .marker-cluster-medium {
      background-color: rgba(240, 194, 120, 0.7);
    }
    .marker-cluster-medium div {
      background-color: rgba(240, 146, 43, 0.7);
    }
    .marker-cluster-large {
      background-color: rgba(253, 156, 151, 0.7);
    }
    .marker-cluster-large div {
      background-color: rgba(241, 90, 82, 0.7);
    }
    .marker-cluster {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: white;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .marker-cluster div {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: white;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function postToRN(data) {
      try {
        var msg = typeof data === 'string' ? data : JSON.stringify(data);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(msg);
        } else if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(msg, '*');
        }
      } catch (e) {}
    }

    try {
      var map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
      }).setView([${lat}, ${lng}], ${zoom});

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      ${clusterMarkers ? 'var markers = L.markerClusterGroup();' : ''}

      ${markersJS}

      ${clusterMarkers ? 'map.addLayer(markers);' : ''}

      ${routes
        .map(
          (r, i) =>
            `var coords_${i} = ${JSON.stringify(r.coordinates.map((c) => [c.latitude, c.longitude]))};
            // 1. Route Glow Underlay
            L.polyline(coords_${i}, {
              color: '#145C2E',
              weight: 9,
              opacity: 0.4,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);

            // 2. High-contrast Route Line
            var routePoly_${i} = L.polyline(coords_${i}, {
              color: '${r.color || '#145C2E'}',
              weight: 4.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map)${r.label ? `.bindPopup('${r.label.replace(/'/g, "\\'")}').openPopup()` : ''};
            try {
              map.fitBounds(routePoly_${i}.getBounds(), { padding: [35, 35] });
            } catch(e) {}`,
        )
        .join('\n      ')}

      ${showUserLocation ? `
      var userIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="user-location-pulse"></div><div class="user-location-dot" style="background:#145C2E; border:3px solid #FFF; width:20px; height:20px;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([${lat}, ${lng}], { icon: userIcon, zIndexOffset: 1000 }).bindPopup('<b>🚜 My Farm</b><br>Origin Point').addTo(map);
      ` : ''}

      // Fit bounds if there are multiple markers and no specific route active
      if (${routes.length === 0}) {
        var allPoints = [
          ${showUserLocation ? `[${lat}, ${lng}],` : ''}
          ${markers.map((m) => `[${m.latitude}, ${m.longitude}]`).join(',')}
        ];
        if (allPoints.length > 1) {
          map.fitBounds(allPoints, { padding: [40, 40] });
        }
      }

      ${enableDrawing ? `
      var drawingPoints = [];
      var drawingPolygon = L.polygon([], {color: '#145C2E', weight: 3, fillColor: '#145C2E', fillOpacity: 0.2}).addTo(map);
      map.on('click', function(e) {
        drawingPoints.push(e.latlng);
        drawingPolygon.setLatLngs(drawingPoints);
        postToRN({
          type: 'polygon-update',
          points: drawingPoints
        });
      });
      ` : ''}

      // Ensure proper sizing on load
      setTimeout(function() {
        if (map) {
          map.invalidateSize();
        }
        postToRN({ type: 'map-ready' });
      }, 250);
    } catch (err) {
      console.error('Map init error:', err);
    }
  </script>
</body>
</html>`;
}

export default function LeafletMap({
  latitude,
  longitude,
  zoom = 13,
  markers = [],
  routes = [],
  showUserLocation = true,
  clusterMarkers = false,
  enableDrawing = false,
  style,
  height = 200,
  onMarkerPress,
  onPolygonComplete,
}: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'map-ready') {
          // Map is ready
        }
        if (data.type === 'marker-click' && onMarkerPress) {
          onMarkerPress(data.markerId);
        }
        if (data.type === 'polygon-update' && onPolygonComplete) {
          const formattedPoints = data.points.map((p: any) => ({
            latitude: p.lat,
            longitude: p.lng
          }));
          onPolygonComplete(formattedPoints);
        }
      } catch {}
    },
    [onMarkerPress, onPolygonComplete],
  );

  const html = buildLeafletHTML(latitude, longitude, zoom, markers, routes, showUserLocation, clusterMarkers, enableDrawing);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }, style]}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 24 }}
          title="Leaflet Map"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'https://unpkg.com' }}
        style={styles.webview}
        onMessage={onMessage}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowsInlineMediaPlayback
        mixedContentMode="always"
        startInLoadingState
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  webview: {
    flex: 1,
    backgroundColor: '#E8E8E8',
  },
});
