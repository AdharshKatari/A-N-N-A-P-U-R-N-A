import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { PrecisionAgriCommandDashboard } from '../components/PrecisionAgriCommandDashboard';
import { GlassButton } from '../components/GlassPrimitives';
import { hapticMedium, hapticLight } from '../utils/haptics';

function DrawAOIScreen({ navigation }: any) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 19.9975, lng: 73.7898 });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {}
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F5" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Satellite Farm Grid & Sensors</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <PrecisionAgriCommandDashboard
          farmName="Annapurna Precision Smart Farm"
          location="Nashik Agricultural Corridor"
          initialLatitude={userCoords.lat}
          initialLongitude={userCoords.lng}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(DrawAOIScreen, 'DrawAOI');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF9F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: '#00431D',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9ED',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#00431D',
    marginLeft: 8,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#145C2E',
    borderWidth: 1.5,
  },
  clearBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#145C2E',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145C2E',
  },
  saveBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFF',
    fontSize: 15,
  },
});
