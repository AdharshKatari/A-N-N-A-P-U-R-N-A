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
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getNearbySalvage } from '../services/api';
import { withErrorBoundary } from '../components/ErrorBoundary';
import LeafletMap from '../components/LeafletMap';
import type { MapMarker, MapRoute } from '../components/LeafletMap';
import { getDrivingRoute } from '../services/routing';

function RouteScreen({ navigation, route }: any) {
  const customDestination = route?.params?.destination;

  const [activeFilter, setActiveFilter] = useState<'nearest' | 'best_price' | 'open_now'>('nearest');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('East Field area');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 19.9975, lng: 73.7898 });
  const [selectedFacilityIndex, setSelectedFacilityIndex] = useState<number | null>(null);
  const [activeRoute, setActiveRoute] = useState<MapRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      let lat = 19.9975, lng = 73.7898;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setUserCoords({ lat, lng });
          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geocode.length > 0) {
            const place = geocode[0];
            setLocationName(`${place.city || place.district || 'East Field'} area`);
          }
        }
      } catch (e) {}

      if (customDestination) {
        setFacilities([
          {
            id: customDestination.id || 'custom-dest',
            name: customDestination.name,
            type: customDestination.type || 'Mandi',
            latitude: customDestination.latitude,
            longitude: customDestination.longitude,
            distance_km: customDestination.distance || 0,
            price_offered: customDestination.price || 0,
          }
        ]);
        // We will trigger handleShowRoute(0) in a separate useEffect once facilities is set
      } else {
        const result = await getNearbySalvage(lat, lng, 50);
        setFacilities(result?.facilities || []);
      }
    } catch (err) {
      setError('Failed to load nearby facilities. Pull down to retry.');
      console.error('Route fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customDestination]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // If a custom destination was passed, automatically show its route
  useEffect(() => {
    if (customDestination && facilities.length === 1 && selectedFacilityIndex === null) {
      handleShowRoute(0);
    }
  }, [facilities, customDestination, selectedFacilityIndex]);

  const handleShowRoute = useCallback(
    async (facilityIndex: number) => {
      const facility = facilities[facilityIndex];
      if (!facility) return;

      // Toggle off if same facility clicked again
      if (selectedFacilityIndex === facilityIndex) {
        setSelectedFacilityIndex(null);
        setActiveRoute(null);
        setRouteInfo(null);
        setMapKey((k) => k + 1);
        return;
      }

      setSelectedFacilityIndex(facilityIndex);
      setRouteLoading(true);
      setActiveRoute(null);
      setRouteInfo(null);

      const destLat = facility.latitude || userCoords.lat;
      const destLng = facility.longitude || userCoords.lng;

      let route = await getDrivingRoute(
        { latitude: userCoords.lat, longitude: userCoords.lng },
        { latitude: destLat, longitude: destLng },
      );

      // Graceful fallback route when OSRM routing is slow/offline
      if (!route) {
        const midLat = (userCoords.lat + destLat) / 2 + 0.008;
        const midLng = (userCoords.lng + destLng) / 2 - 0.006;
        const approxDistKm = (facility.distance_km || Math.hypot(destLat - userCoords.lat, destLng - userCoords.lng) * 111).toFixed(1);
        const approxMin = Math.round(Number(approxDistKm) * 2.2);

        route = {
          coordinates: [
            { latitude: userCoords.lat, longitude: userCoords.lng },
            { latitude: midLat, longitude: midLng },
            { latitude: destLat, longitude: destLng },
          ],
          distanceMeters: Number(approxDistKm) * 1000,
          durationSeconds: approxMin * 60,
          distanceText: `${approxDistKm} km`,
          durationText: `${approxMin} min`,
        };
      }

      if (route) {
        setActiveRoute({
          coordinates: route.coordinates,
          color: '#145C2E',
          weight: 5,
          opacity: 0.85,
          label: `${route.distanceText} · ${route.durationText}`,
        });
        setRouteInfo({ distance: route.distanceText, duration: route.durationText });
      }

      setRouteLoading(false);
      setMapKey((k) => k + 1);
    },
    [facilities, selectedFacilityIndex, userCoords],
  );

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
        <Text style={styles.headerTitle}>Nearby Markets</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search markets" testID="route-search-markets"
          style={styles.searchButton} activeOpacity={0.7} onPress={() => navigation.navigate('Main', { screen: 'Market' })}>
          <MaterialIcons name="search" size={24} color="#00431D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#145C2E" />
        }
      >
        {/* Location Context */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeaderRow}>
            <View style={styles.locationTitleLeft}>
              <MaterialIcons name="location-on" size={20} color="#00431D" />
              <Text style={styles.locationTitleText}>{locationName} · Paddy</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh current location" testID="route-refresh-location"
              activeOpacity={0.7} onPress={() => fetchData()}>
              <MaterialIcons name="edit" size={18} color="#00431D" />
            </TouchableOpacity>
          </View>
          <Text style={styles.locationSubtext}>Best markets near your farm</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'nearest' && styles.filterPillActive]}
            onPress={() => setActiveFilter('nearest')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, activeFilter === 'nearest' && styles.filterPillTextActive]}>
              Nearest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'best_price' && styles.filterPillActive]}
            onPress={() => setActiveFilter('best_price')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, activeFilter === 'best_price' && styles.filterPillTextActive]}>
              Best Price
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'open_now' && styles.filterPillActive]}
            onPress={() => setActiveFilter('open_now')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, activeFilter === 'open_now' && styles.filterPillTextActive]}>
              Open Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Map — OpenStreetMap + Leaflet.js */}
        <View style={styles.mapCard}>
          <LeafletMap
            key={mapKey}
            latitude={userCoords.lat}
            longitude={userCoords.lng}
            zoom={12}
            showUserLocation
            clusterMarkers
            markers={facilities.map((f: any, i: number) => ({
              id: `facility-${i}`,
              latitude: f.latitude || userCoords.lat,
              longitude: f.longitude || userCoords.lng,
              title: f.name || f.type || `Facility ${i + 1}`,
              subtitle: f.type || 'Processing Plant',
              color: selectedFacilityIndex === i ? '#E65100' : i === 0 ? '#145C2E' : '#404940',
              icon: selectedFacilityIndex === i ? '🎯' : i === 0 ? '⭐' : '📍',
            } as MapMarker))}
            routes={activeRoute ? [activeRoute] : []}
            height={activeRoute ? 240 : 200}
            style={styles.mapContainer}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.marketsFoundPill}>
              {routeInfo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="directions-car" size={14} color="#00431D" />
                  <Text style={styles.marketsFoundText}>{routeInfo.distance} · {routeInfo.duration}</Text>
                </View>
              ) : (
                <Text style={styles.marketsFoundText}>{facilities.length} Markets Found</Text>
              )}
            </View>
            <TouchableOpacity style={styles.myLocationButton} activeOpacity={0.8} onPress={() => fetchData()}>
              <MaterialIcons name="my-location" size={20} color="#145C2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Smart Suggestion */}
        <View style={styles.smartSuggestionCard}>
          <MaterialIcons name="lightbulb" size={22} color="#00431D" style={{ marginTop: 2 }} />
          <Text style={styles.smartSuggestionText}>
            The 8 km market offers a slightly lower price but reduces transport time by 30 mins.
          </Text>
        </View>

        {/* Market List */}
        <View style={styles.marketList}>
          {loading ? (
            <ActivityIndicator size="large" color="#145C2E" style={{ marginVertical: 20 }} />
          ) : facilities.length > 0 ? (
            facilities.map((facility: any, index: number) => (
              <View key={index} style={index === 0 ? styles.recommendedMarketCard : styles.standardMarketCard}>
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={index === 0 ? styles.recommendedMarketName : styles.marketName}>{facility.name || facility.type || `Facility ${index + 1}`}</Text>
                <View style={styles.distanceRow}>
                  <MaterialIcons name="navigation" size={14} color="#404940" />
                  <Text style={styles.distanceText}>8 km away</Text>
                </View>
              </View>
                  {index === 0 && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                    </View>
                  )}
                </View>

                <View style={styles.bottomPriceRow}>
                  <View style={styles.priceRow}>
                    <Text style={index === 0 ? styles.priceNumber : styles.priceNumberDark}>{facility.type || 'Processing Plant'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {selectedFacilityIndex === index && routeLoading && (
                    <ActivityIndicator size="small" color="#145C2E" />
                  )}
                  <TouchableOpacity
                    style={[styles.showRouteButton, selectedFacilityIndex === index && styles.showRouteButtonActive]}
                    onPress={() => handleShowRoute(index)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={selectedFacilityIndex === index ? 'close' : 'directions'}
                      size={16}
                      color={selectedFacilityIndex === index ? '#FFFFFF' : '#145C2E'}
                    />
                    <Text style={[styles.showRouteButtonText, selectedFacilityIndex === index && styles.showRouteButtonTextActive]}>
                      {selectedFacilityIndex === index ? 'Hide' : 'Route'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chevronButton} activeOpacity={0.7} onPress={() => handleShowRoute(index)}>
                    <MaterialIcons name="chevron-right" size={20} color="#00431D" />
                  </TouchableOpacity>
                </View>
              </View>
              </View>
            ))
          ) : (
            <View style={[styles.standardMarketCard, { alignItems: 'center', padding: 30 }]}>
              <MaterialIcons name="location-off" size={40} color="#C0C9BD" />
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#707A6F', marginTop: 12 }}>No facilities found nearby</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(RouteScreen, 'Route');

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
  searchButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  locationSection: {
    gap: 4,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationTitleText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#00431D',
  },
  locationSubtext: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F2EDE4',
    borderWidth: 1,
    borderColor: '#C0C9BD',
  },
  filterPillActive: {
    backgroundColor: '#145C2E',
    borderColor: '#145C2E',
  },
  filterPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#1D1C16',
    textTransform: 'uppercase',
  },
  filterPillTextActive: {
    color: '#145C2E',
  },
  mapCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketsFoundPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  marketsFoundText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#00431D',
  },
  myLocationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#145C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartSuggestionCard: {
    backgroundColor: '#F5F3ED',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  smartSuggestionText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#072010',
  },
  marketList: {
    gap: 14,
  },
  recommendedMarketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#145C2E',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recommendedMarketName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#00431D',
  },
  marketName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1D1C16',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distanceText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  recommendedBadge: {
    backgroundColor: '#145C2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#145C2E',
  },
  higherPriceBadge: {
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  higherPriceBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#93000A',
  },
  closestBadge: {
    backgroundColor: '#F5F3ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closestBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#145C2E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceNumber: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#00431D',
  },
  priceNumberDark: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: '#1D1C16',
  },
  unitText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#404940',
  },
  taglineText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    fontStyle: 'italic',
    color: '#404940',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#145C2E',
    borderRadius: 28,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directionsButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#145C2E',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2EDE4',
    borderWidth: 1,
    borderColor: '#C0C9BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardMarketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  bottomPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2EDE4',
    borderWidth: 1,
    borderColor: '#C0C9BD',
  },
  showRouteButtonActive: {
    backgroundColor: '#145C2E',
    borderColor: '#145C2E',
  },
  showRouteButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#145C2E',
  },
  showRouteButtonTextActive: {
    color: '#FFFFFF',
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
