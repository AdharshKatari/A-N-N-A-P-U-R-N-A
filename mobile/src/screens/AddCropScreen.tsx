import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createBatch, getCropsMetadata } from '../services/api';
import { withErrorBoundary } from '../components/ErrorBoundary';
import CalendarPicker from '../components/CalendarPicker';
import MapLocationPicker from '../components/MapLocationPicker';
import AdaptiveSlider from '../components/AdaptiveSlider';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
  GlassLevels,
  GlassColors,
  GlassShadows,
} from '../constants/theme';
import {
  GlassCard,
  GlassPanel,
  GlassButton,
  GlassChip,
  AnimatedPressable,
  FadeIn,
  useReducedMotion,
  MotionTokens,
} from '../components/GlassPrimitives';
import { useLanguage } from '../context/LanguageContext';

const UNITS = ['Acres', 'Hectares', 'Bigha', 'Guntha', 'Sq. Meters'];

function formatDateDisplay(date: Date): string {
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function AddCropScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [cropType, setCropType] = useState('Paddy');
  const [variety, setVariety] = useState('BPT 5204');
  const [sowingDate, setSowingDate] = useState(() => new Date());
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date;
  });
  const [farmArea, setFarmArea] = useState('2.5');
  const [expectedYieldKg, setExpectedYieldKg] = useState(250);
  const [unit, setUnit] = useState('Acres');
  const [locationName, setLocationName] = useState('Current Location');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Calendar state
  const [activeCalendar, setActiveCalendar] = useState<'planting' | 'harvest' | null>(null);

  // Map state
  const [showMap, setShowMap] = useState(false);

  const [cropTypesList, setCropTypesList] = useState<{label: string, value: string, icon: string}[]>([]);
  const [varietiesConfig, setVarietiesConfig] = useState<Record<string, string[]>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Auto-detect location and load metadata on mount
  useEffect(() => {
    detectInitialLocation();
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const data = await getCropsMetadata();
      if (data && data.crops) {
        setCropTypesList(data.crops);
        setVarietiesConfig(data.varieties || {});
      }
    } catch (err) {
      console.error('Failed to fetch crops metadata:', err);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const detectInitialLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setLocationLat(lat);
        setLocationLng(lng);

        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode.length > 0) {
          const place = geocode[0];
          const name = [place.name, place.street, place.city].filter(Boolean).join(', ');
          setLocationName(name || 'Current Location');
        }
      }
    } catch (err) {
      console.error('Initial location detection failed:', err);
    }
  };

  const dropdownItems = (() => {
    switch (activeDropdown) {
      case 'cropType':
        return cropTypesList.map((c) => ({ label: c.label, value: c.value }));
      case 'variety':
        return (varietiesConfig[cropType] || []).map((v) => ({ label: v, value: v }));
      case 'unit':
        return UNITS.map((u) => ({ label: u, value: u }));
      default:
        return [];
    }
  })();

  const dropdownTitle = (() => {
    switch (activeDropdown) {
      case 'cropType': return 'Select Crop Type';
      case 'variety': return 'Select Variety';
      case 'unit': return 'Select Unit';
      default: return '';
    }
  })();

  const handleSelect = (value: string) => {
    switch (activeDropdown) {
      case 'cropType':
        setCropType(value);
        const newVarieties = varietiesConfig[value] || [];
        if (newVarieties.length > 0) setVariety(newVarieties[0]);
        break;
      case 'variety':
        setVariety(value);
        break;
      case 'unit':
        setUnit(value);
        break;
    }
    setActiveDropdown(null);
  };

  const handleDateConfirm = (date: Date) => {
    if (activeCalendar === 'planting') {
      setSowingDate(date);
      if (expectedHarvestDate <= date) {
        const nextHarvest = new Date(date);
        nextHarvest.setDate(nextHarvest.getDate() + 90);
        setExpectedHarvestDate(nextHarvest);
      }
    } else {
      setExpectedHarvestDate(date);
    }
    setActiveCalendar(null);
  };

  const handleMapConfirm = (data: { latitude: number; longitude: number; address: string }) => {
    setLocationLat(data.latitude);
    setLocationLng(data.longitude);
    setLocationName(data.address);
    setShowMap(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await createBatch({
        initial_weight_kg: expectedYieldKg,
        harvest_timestamp: new Date().toISOString(),
        field_id: `${cropType} - ${locationName}`,
      });
      Alert.alert('Success', `Batch created! ID: ${result.batch_id?.slice(0, 8)}`, [
        { text: 'OK', onPress: () => navigation?.navigate('CropDetails', {
          batchId: result.batch_id,
          crop: cropType,
          field: locationName,
          plantingDate: sowingDate.toISOString(),
          expectedHarvestDate: expectedHarvestDate.toISOString(),
        }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create batch');
    } finally {
      setSaving(false);
    }
  };

  const reducedMotion = useReducedMotion();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('action_add_crop', 'Add Crop')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSubtitle}>{t('add_crop_sub', 'Add your crop details to start tracking')}</Text>

        {/* Card 1: Main Details */}
        <FadeIn delay={50} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
        <GlassCard level="level1" style={styles.formCard}>
          {/* Crop Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Crop Type *</Text>
            <TouchableOpacity
              style={styles.pickerInputRow}
              activeOpacity={0.7}
              onPress={() => setActiveDropdown('cropType')}
            >
              <View style={styles.pickerLeft}>
                <View style={styles.cropIconCircle}>
                  <MaterialCommunityIcons name="grass" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.pickerTextBold}>{cropType}</Text>
              </View>
              <MaterialIcons name="expand-more" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Variety */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Variety *</Text>
            <TouchableOpacity
              style={styles.pickerInputRow}
              activeOpacity={0.7}
              onPress={() => setActiveDropdown('variety')}
            >
              <Text style={styles.pickerTextBold}>{variety}</Text>
              <MaterialIcons name="expand-more" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </GlassCard>
        </FadeIn>

        {/* Card 2: Logistics */}
        <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
        <GlassCard level="level1" style={styles.formCard}>
          {/* Sowing Date — Calendar Popup */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sowing Date</Text>
            <TouchableOpacity
              style={styles.pickerInputRow}
              activeOpacity={0.7}
              onPress={() => setActiveCalendar('planting')}
            >
              <MaterialIcons name="calendar-month" size={20} color={Colors.primaryDeep} />
              <Text style={styles.pickerTextBold}>{formatDateDisplay(sowingDate)}</Text>
              <MaterialIcons name="edit-calendar" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Expected Harvest</Text>
            <TouchableOpacity
              style={styles.pickerInputRow}
              activeOpacity={0.7}
              onPress={() => setActiveCalendar('harvest')}
            >
              <MaterialIcons name="event-available" size={20} color={Colors.primaryDeep} />
              <Text style={styles.pickerTextBold}>{formatDateDisplay(expectedHarvestDate)}</Text>
              <MaterialIcons name="edit-calendar" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Farm Area */}
          <View style={styles.fieldGroup}>
            <AdaptiveSlider
              label="Farm Area"
              value={Number(farmArea)}
              min={0.5}
              max={10}
              step={0.5}
              unit={unit}
              decimals={1}
              markers={[0.5, 2, 5, 10]}
              onChange={(value) => setFarmArea(value.toFixed(1))}
            />
            <View style={styles.sliderUnitRow}>
              <Text style={styles.sliderHint}>Drag to adjust field size</Text>
              <TouchableOpacity
                style={styles.unitPicker}
                activeOpacity={0.7}
                onPress={() => setActiveDropdown('unit')}
              >
                <Text style={styles.unitText}>{unit}</Text>
                <MaterialIcons name="unfold-more" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <AdaptiveSlider
              label="Expected Yield"
              value={expectedYieldKg}
              min={50}
              max={500}
              step={25}
              unit="kg"
              markers={[50, 150, 300, 500]}
              onChange={setExpectedYieldKg}
            />
          </View>
        </GlassCard>
        </FadeIn>

        {/* Card 3: Location — Google Maps */}
        <FadeIn delay={200} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
        <GlassCard level="level1" style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Farm Location</Text>

            {/* Current location display */}
            <TouchableOpacity
              style={styles.pickerInputRow}
              activeOpacity={0.7}
              onPress={() => setShowMap(true)}
            >
              <MaterialIcons name="location-on" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerTextBold} numberOfLines={1}>{locationName}</Text>
                {locationLat && locationLng && (
                  <Text style={styles.coordsText}>
                    {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                  </Text>
                )}
              </View>
              <MaterialIcons name="map" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Quick action: Use current location */}
            <TouchableOpacity
              style={styles.useCurrentLocationBtn}
              activeOpacity={0.7}
              onPress={detectInitialLocation}
            >
              <MaterialIcons name="my-location" size={18} color={Colors.primary} />
              <Text style={styles.useCurrentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
        </FadeIn>

        {/* Submit Button */}
        <FadeIn delay={300} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
        <GlassButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
          haptic="medium"
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>{t('save_changes', 'Save Crop Details')}</Text>
          )}
        </GlassButton>
        </FadeIn>
      </ScrollView>

      {/* Calendar Popup */}
      <CalendarPicker
        visible={activeCalendar !== null}
        selectedDate={activeCalendar === 'harvest' ? expectedHarvestDate : sowingDate}
        onConfirm={handleDateConfirm}
        onCancel={() => setActiveCalendar(null)}
        maximumDate={activeCalendar === 'planting' ? new Date() : undefined}
        minimumDate={activeCalendar === 'harvest' ? sowingDate : undefined}
        eyebrow={activeCalendar === 'harvest' ? 'EXPECTED HARVEST' : 'PLANTING DATE'}
      />

      {/* Google Maps Location Picker */}
      <MapLocationPicker
        visible={showMap}
        initialLatitude={locationLat || 19.9975}
        initialLongitude={locationLng || 73.7898}
        onConfirm={handleMapConfirm}
        onCancel={() => setShowMap(false)}
      />

      {/* Generic Dropdown Modal */}
      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dropdownTitle}</Text>
              <TouchableOpacity onPress={() => setActiveDropdown(null)} style={styles.modalClose}>
                <MaterialIcons name="close" size={24} color={Colors.primaryDeep} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={dropdownItems}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected =
                  (activeDropdown === 'cropType' && item.value === cropType) ||
                  (activeDropdown === 'variety' && item.value === variety) ||
                  (activeDropdown === 'unit' && item.value === unit);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color="#00431D" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

export default withErrorBoundary(AddCropScreen, 'Add Crop');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    backgroundColor: '#FAF9F5',
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
    color: '#4A803D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 20,
  },
  headerSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
  },
  pickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C0C9BD',
    backgroundColor: '#F8F3EA',
    gap: 10,
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cropIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#91F5A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTextBold: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1D1C16',
  },
  coordsText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#707A6F',
    marginTop: 1,
  },
  areaInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderHint: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#8A8F87',
  },
  areaInput: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C0C9BD',
    backgroundColor: '#F8F3EA',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#1D1C16',
    textAlign: 'center',
  },
  unitPicker: {
    width: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C0C9BD',
    backgroundColor: '#F8F3EA',
  },
  unitText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#1D1C16',
  },
  useCurrentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A803D',
    borderStyle: 'dashed',
    backgroundColor: '#F0FFF4',
  },
  useCurrentLocationText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#4A803D',
  },
  saveButton: {
    backgroundColor: '#145C2E',
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Dropdown modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#4A803D',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#E8F4E6',
  },
  modalItemText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: '#1D1C16',
  },
  modalItemTextSelected: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#4A803D',
  },
  // Calendar picker styles
  // Map location picker styles
});
