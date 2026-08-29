/**
 * MapLocationPicker — Google Maps WebView with current location detection.
 *
 * Features:
 * - Auto-detects current GPS location on open
 * - Shows Google Maps with a draggable pin
 * - Tap anywhere on the map to move the pin
 * - "Use Current Location" button to re-center on GPS
 * - Returns selected coordinates + reverse-geocoded address
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import TextShimmer from './TextShimmer';

interface MapLocationPickerProps {
  visible: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (data: { latitude: number; longitude: number; address: string }) => void;
  onCancel: () => void;
}

function buildMapHTML(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; position: absolute; top:0; left:0; right:0; bottom:0; }
    #pin {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 999;
      font-size: 36px;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
    #coords-bar {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background: rgba(255,255,255,0.95);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #333;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #coords-bar span { font-weight: 600; color: #00431D; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">●</div>
  <div id="coords-bar">
    <span id="coords-text">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
  </div>

  <script>
    var map;
    var centerLat = ${lat};
    var centerLng = ${lng};

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

    function initMap() {
      try {
        map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: centerLat, lng: centerLng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        map.addListener('click', function(e) {
          centerLat = e.latLng.lat();
          centerLng = e.latLng.lng();
          document.getElementById('coords-text').textContent =
            centerLat.toFixed(6) + ', ' + centerLng.toFixed(6);
          postToRN({
            type: 'move',
            lat: centerLat,
            lng: centerLng
          });
        });

        // Safe ready notification
        setTimeout(function() {
          postToRN({
            type: 'ready',
            lat: centerLat,
            lng: centerLng
          });
        }, 300);
      } catch (err) {
        console.error('Google Map init error:', err);
      }
    }

    function recenterMap(lat, lng) {
      if (map) {
        centerLat = lat;
        centerLng = lng;
        map.setCenter({ lat: lat, lng: lng });
        var el = document.getElementById('coords-text');
        if (el) el.textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
      }
    }
  </script>
  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&callback=initMap">
  </script>
</body>
</html>`;
}

export default function MapLocationPicker({
  visible,
  initialLatitude = 19.9975,
  initialLongitude = 73.7898,
  onConfirm,
  onCancel,
}: MapLocationPickerProps) {
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [address, setAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Auto-detect current location when modal opens
  useEffect(() => {
    if (visible) {
      detectCurrentLocation();
    }
  }, [visible]);

  const detectCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get address
        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geocode.length > 0) {
            const place = geocode[0];
            const addr = [
              place.name,
              place.street,
              place.district || place.subregion,
              place.city,
              place.region,
            ].filter(Boolean).join(', ');
            setAddress(addr);
          }
        } catch (e) {}

        // Recenter map if already loaded
        if (mapReady && webViewRef.current) {
          webViewRef.current.injectJavaScript(`recenterMap(${lat}, ${lng})`);
        }
      }
    } catch (err) {
      console.error('Location detection failed:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const onWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'move' || data.type === 'ready') {
        setLatitude(data.lat);
        setLongitude(data.lng);
        if (data.type === 'ready') setMapReady(true);

        // Reverse geocode the new position
        Location.reverseGeocodeAsync({ latitude: data.lat, longitude: data.lng })
          .then((results) => {
            if (results.length > 0) {
              const place = results[0];
              const addr = [
                place.name,
                place.street,
                place.district || place.subregion,
                place.city,
                place.region,
              ].filter(Boolean).join(', ');
              setAddress(addr);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleConfirm = () => {
    const displayAddress = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    onConfirm({ latitude, longitude, address: displayAddress });
  };

  const mapHtml = buildMapHTML(latitude, longitude);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} />
        <View style={styles.expandedCard}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.7}>
            <MaterialIcons name="close" size={24} color="#00431D" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.doneBtn} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Google Maps Location Picker"
            />
          ) : (
            <WebView
              ref={webViewRef}
              source={{ html: mapHtml, baseUrl: 'https://maps.googleapis.com' }}
              onMessage={onWebViewMessage}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              allowsInlineMediaPlayback
              mixedContentMode="always"
            />
          )}

          {/* Loading overlay */}
          {loadingLocation && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#145C2E" />
              <TextShimmer style={styles.loadingText}>Detecting your location...</TextShimmer>
            </View>
          )}

          {/* Center pin overlay */}
          <View style={styles.pinOverlay} pointerEvents="none">
            <MaterialIcons name="location-pin" size={42} color="#145C2E" />
          </View>
        </View>

        {/* Bottom Panel */}
        <View style={styles.bottomPanel}>
          {/* Address Display */}
          <View style={styles.addressRow}>
            <MaterialIcons name="location-on" size={20} color="#145C2E" />
            <Text style={styles.addressText} numberOfLines={2}>
              {address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
            </Text>
          </View>

          {/* Coordinates */}
          <View style={styles.coordsRow}>
            <Text style={styles.coordLabel}>Lat: {latitude.toFixed(6)}</Text>
            <Text style={styles.coordLabel}>Lng: {longitude.toFixed(6)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.currentLocationBtn}
              onPress={detectCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.8}
            >
              <MaterialIcons name="my-location" size={20} color="#145C2E" />
              <Text style={styles.currentLocationText}>
                {loadingLocation ? 'Locating...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 28, 20, 0.52)',
    justifyContent: 'center',
    padding: 18,
  },
  expandedCard: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    maxHeight: 760,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3ED',
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#00431D',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#145C2E',
  },
  doneBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: '#145C2E',
  },
  pinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -36 }],
    alignItems: 'center',
  },
  pin: {
    fontSize: 36,
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#1D1C16',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coordLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#707A6F',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  currentLocationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#145C2E',
  },
  currentLocationText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#145C2E',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#145C2E',
  },
  confirmBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
