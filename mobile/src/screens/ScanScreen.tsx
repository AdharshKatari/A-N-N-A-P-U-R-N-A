import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Dimensions,
  Animated,
  TextInput,
  Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import Slider from '@react-native-community/slider';
import { api } from '../lib/apiClient';
import { withErrorBoundary } from '../components/ErrorBoundary';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import {
  GlassCard,
  GlassPanel,
  GlassButton,
  GlassBadge,
  GlassProgress,
  GlassSkeleton,
  GlassSkeletonCard,
  AnimatedPressable,
  FadeIn,
  useReducedMotion,
  MotionTokens,
} from '../components/GlassPrimitives';
import { useOfflineQueue } from '../utils/offlineQueue';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SAMPLE_COUNT = 5;

interface FruitSample {
  uri: string;
  base64: string;
  gps: { lat: number; lng: number } | null;
  timestamp: string;
  sequence: number;
}

interface ScanScreenParams {
  batchId?: string;
  cropType?: string;
  fieldId?: string;
}

function ScanScreen({ navigation, route }: any) {
  const params = route?.params as ScanScreenParams | undefined;
  const [isCapturing, setIsCapturing] = useState(false);
  const [cropTypes, setCropTypes] = useState<string[]>(['Tomatoes', 'Mangoes', 'Onions', 'Potatoes', 'Paddy', 'Wheat']);
  const [selectedCrop, setSelectedCrop] = useState(params?.cropType || 'Tomatoes');
  const [cropField, setCropField] = useState(params?.fieldId || 'East Field');
  const [growthStage, setGrowthStage] = useState('Growth Stage: Fruiting');
  const [cropModalVisible, setCropModalVisible] = useState(false);

  useEffect(() => {
    api.dashboard.get().then(res => {
      if (res.by_crop_category && res.by_crop_category.length > 0) {
        setCropTypes(res.by_crop_category.map((c: any) => c.crop_category));
      }
    }).catch(err => console.info('[Scan] Failed to load crop types:', err));
  }, []);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [manualGpsMode, setManualGpsMode] = useState(false);
  const [manualGpsInput, setManualGpsInput] = useState({ lat: '', lng: '' });

  const samples = useRef<FruitSample[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualInputs, setManualInputs] = useState({
    bruisingIndex: 0,
    colorRipeness: 1,
    firmness: 2,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const { enqueueTransaction } = useOfflineQueue();

  useEffect(() => {
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      pulseAnim.setValue(0);
    });
  }, []);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setGpsAccuracy(loc.coords.accuracy || null);
          setGpsPermissionDenied(false);
        } else {
          setGpsPermissionDenied(true);
          setManualGpsMode(true);
        }
      } catch (e) {
        console.log('Location fetch error in scan:', e);
        setGpsPermissionDenied(true);
        setManualGpsMode(true);
      }
    };
    initLocation();
  }, []);

  const updateProgress = useCallback((index: number) => {
    setCurrentSampleIndex(index);
    Animated.timing(progressAnim, {
      toValue: index / SAMPLE_COUNT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);

  const validateSample = (sample: FruitSample): boolean => {
    if (!sample.base64 || sample.base64.length < 100) return false;
    return true;
  };

  const processImage = async (uri: string): Promise<string> => {
    try {
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.WEBP,
          base64: true,
        }
      );
      return manip.base64 || '';
    } catch (err) {
      console.error('Image processing error:', err);
      try {
        const fallback = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
        );
        return fallback.base64 || '';
      } catch {
        return '';
      }
    }
  };

  const captureSample = async (source: 'camera' | 'gallery') => {
    if (isCapturing) return;
    if (currentSampleIndex >= SAMPLE_COUNT) {
      Alert.alert('Complete', 'All 5 samples captured. Proceed to analysis.');
      return;
    }

    setIsCapturing(true);
    setProcessingError(null);

    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to scan crops.');
          setIsCapturing(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: false,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery access is needed to select crop photos.');
          setIsCapturing(false);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: false,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const base64 = await processImage(uri);
        
        if (!base64) {
          Alert.alert('Processing Failed', 'Could not process image. Try again.');
          setIsCapturing(false);
          return;
        }

        let sampleGps = gpsCoords;
        if (!sampleGps && manualGpsMode) {
          const lat = parseFloat(manualGpsInput.lat);
          const lng = parseFloat(manualGpsInput.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            sampleGps = { lat, lng };
          }
        }

        const sample: FruitSample = {
          uri,
          base64,
          gps: sampleGps,
          timestamp: new Date().toISOString(),
          sequence: currentSampleIndex + 1,
        };

        if (!validateSample(sample)) {
          Alert.alert('Invalid Image', 'Image quality too low. Please retake.');
          setIsCapturing(false);
          return;
        }

        samples.current[currentSampleIndex] = sample;
        setPreviewUri(uri);
        updateProgress(currentSampleIndex + 1);

        if (currentSampleIndex + 1 >= SAMPLE_COUNT) {
          setTimeout(() => navigateToAnalysis(), 500);
        }
      }
    } catch (err: any) {
      console.error(`${source} error:`, err);
      Alert.alert(`${source.charAt(0).toUpperCase() + source.slice(1)} Error`, err.message || `Could not open ${source}.`);
    } finally {
      setIsCapturing(false);
    }
  };

  const navigateToAnalysis = () => {
    const validSamples = samples.current.filter(s => s && validateSample(s));
    if (validSamples.length < SAMPLE_COUNT) {
      Alert.alert('Insufficient Samples', `Need ${SAMPLE_COUNT} samples for analysis. You have ${validSamples.length}.`);
      return;
    }

    const batchId = params?.batchId || `FG-${Date.now()}`;
    
    navigation.navigate('Analysis', {
      batchId,
      cropType: selectedCrop,
      field: cropField,
      samples: validSamples,
      gps: gpsCoords,
      manualGps: manualGpsMode ? { lat: parseFloat(manualGpsInput.lat), lng: parseFloat(manualGpsInput.lng) } : null,
    });
  };

  const handleManualFallbackSubmit = async () => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      const batchId = params?.batchId || `FG-${Date.now()}`;
      const derivedVisualScore = Math.max(0, 100 - manualInputs.bruisingIndex * 25);
      const ripenessMap = ['Unripe', 'Optimal', 'Overripe'];
      const derivedRipeness = ripenessMap[manualInputs.colorRipeness] || 'Optimal';

      await api.batches.create({
        initial_weight_kg: 100,
        field_id: cropField,
        qr_code_secure_token: batchId,
      });
      
      Alert.alert('Success', 'Manual assessment submitted. Analysis complete.');
      navigation.navigate('Recommendation', { crop: selectedCrop, field: cropField });
    } catch (err: any) {
      console.error('Manual fallback error:', err);
      setProcessingError(err.message || 'Failed to process manual assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  const validSampleCount = samples.current.filter(s => s && validateSample(s)).length;
  const canProceed = validSampleCount >= SAMPLE_COUNT;
  const completedSamples = validSampleCount;
  const reducedMotion = useReducedMotion();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDeep} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Scan Crop</Text>
          <Text style={styles.headerSubtitle}>Sample {completedSamples} of {SAMPLE_COUNT}</Text>
        </View>

        <TouchableOpacity
          style={styles.activeCropPill}
          onPress={() => setCropModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.activeCropLabel}>Crop:</Text>
          <Text style={styles.activeCropValue}>{selectedCrop}</Text>
          <MaterialIcons name="arrow-drop-down" size={20} color={Colors.primaryDeep} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <GlassCard level="level1" style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>5-Fruit Sampling Protocol</Text>
            <Text style={styles.progressCount}>{completedSamples} / {SAMPLE_COUNT}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${(completedSamples / SAMPLE_COUNT) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressSteps}>
            {Array.from({ length: SAMPLE_COUNT }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.progressStep,
                  i < completedSamples && styles.progressStepDone,
                  i === currentSampleIndex && !isCapturing && styles.progressStepActive,
                ]}
              >
                <Text style={[
                  styles.progressStepNumber,
                  i < completedSamples && styles.progressStepNumberDone,
                ]}>
                  {i + 1}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Camera Preview Area */}
        <GlassCard level="level1" style={styles.cameraContainer}>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <MaterialIcons name="camera-alt" size={48} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>
                {completedSamples === 0 ? 'Tap capture to start sampling' : `Sample ${completedSamples + 1} of ${SAMPLE_COUNT}`}
              </Text>
            </View>
          )}

          <View style={styles.cameraOverlay} />

          <View style={styles.framingGuide}>
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />

            <View style={styles.guideTopPill}>
              <Text style={styles.guideTopPillText}>
                Position fruit #{currentSampleIndex + 1} clearly in frame
              </Text>
            </View>

            <View style={styles.guideBottomPill}>
              <Animated.View
                style={[
                  styles.pulsingDot,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.4, 1, 0.4],
                    }),
                  },
                ]}
              />
              <Text style={styles.guideBottomPillText}>
                {isCapturing ? 'Processing...' : canProceed ? 'Ready for analysis' : `Capture sample ${currentSampleIndex + 1}`}
              </Text>
            </View>
          </View>

          {gpsCoords && (
            <View style={styles.gpsBadge}>
              <MaterialIcons name="my-location" size={12} color="#FFFFFF" />
              <Text style={styles.gpsBadgeText}>
                GPS: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ''}
              </Text>
            </View>
          )}

          {gpsPermissionDenied && !manualGpsMode && (
            <View style={styles.gpsFallbackBanner}>
              <MaterialIcons name="location-off" size={14} color={Colors.warning} />
              <Text style={styles.gpsFallbackText}>GPS denied. Tap to enter coordinates manually.</Text>
              <TouchableOpacity onPress={() => setManualGpsMode(true)}>
                <Text style={styles.gpsFallbackAction}>Enter Manually</Text>
              </TouchableOpacity>
            </View>
          )}

          {manualGpsMode && (
            <View style={styles.manualGpsInput}>
              <Text style={styles.manualGpsLabel}>Manual GPS Entry</Text>
              <View style={styles.manualGpsFields}>
                <View style={styles.manualGpsField}>
                  <Text style={styles.manualGpsFieldLabel}>Latitude</Text>
                  <TextInput
                    style={styles.manualGpsTextInput}
                    value={manualGpsInput.lat}
                    onChangeText={(v) => setManualGpsInput({ ...manualGpsInput, lat: v })}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 19.9975"
                  />
                </View>
                <View style={styles.manualGpsField}>
                  <Text style={styles.manualGpsFieldLabel}>Longitude</Text>
                  <TextInput
                    style={styles.manualGpsTextInput}
                    value={manualGpsInput.lng}
                    onChangeText={(v) => setManualGpsInput({ ...manualGpsInput, lng: v })}
                    keyboardType="decimal-pad"
                    placeholder="e.g., 73.7898"
                  />
                </View>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Capture Controls */}
        <View style={styles.scanControls}>
          <TouchableOpacity
            style={[styles.controlSecondaryButton, completedSamples >= SAMPLE_COUNT && styles.controlDisabled]}
            onPress={() => captureSample('gallery')}
            disabled={isCapturing || completedSamples >= SAMPLE_COUNT}
            activeOpacity={0.8}
          >
            <MaterialIcons name="photo-library" size={24} color={Colors.primaryDeep} />
          </TouchableOpacity>

          <AnimatedPressable
            style={[
              styles.captureMainButton,
              canProceed && styles.captureReady,
              isCapturing && styles.captureProcessing,
            ]}
            onPress={() => captureSample('camera')}
            disabled={isCapturing}
            activeOpacity={0.85}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.captureInnerRing} />
            )}
          </AnimatedPressable>

          <TouchableOpacity
            style={styles.controlSecondaryButton}
            onPress={() => {
              if (completedSamples > 0) {
                samples.current[currentSampleIndex - 1] = null as any;
                setPreviewUri(null);
                updateProgress(Math.max(0, currentSampleIndex - 1));
              }
            }}
            activeOpacity={0.8}
            disabled={completedSamples === 0}
          >
            <MaterialIcons name="undo" size={24} color={Colors.primaryDeep} />
          </TouchableOpacity>
        </View>

        {/* Crop Context Card */}
        <GlassCard level="level1" style={styles.cropContextCard}>
          <View style={styles.cropContextLeft}>
            <View style={styles.cropContextIconCircle}>
              <MaterialCommunityIcons name="fruit-grapes" size={24} color={Colors.primaryDeep} />
            </View>
            <View>
              <Text style={styles.cropContextTitle}>{cropField}</Text>
              <Text style={styles.cropContextSubtitle}>{growthStage}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setCropModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color={Colors.primaryDeep} />
          </TouchableOpacity>
        </GlassCard>

        {/* Manual Fallback Option */}
        {completedSamples > 0 && completedSamples < SAMPLE_COUNT && (
          <TouchableOpacity
            style={styles.manualFallbackTrigger}
            onPress={() => setShowManualFallback(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
            <Text style={styles.manualFallbackText}>
              Having trouble capturing? Use manual assessment instead
            </Text>
          </TouchableOpacity>
        )}

        {/* Photo Guidance */}
        <GlassCard level="level1" style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>Sampling Guidelines</Text>
          <View style={styles.guidanceList}>
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIconCircle}>
                <MaterialIcons name="wb-sunny" size={18} color={Colors.primaryDeep} />
              </View>
              <Text style={styles.guidanceText}>Capture in good natural light</Text>
            </View>
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIconCircle}>
                <MaterialIcons name="center-focus-strong" size={18} color={Colors.primaryDeep} />
              </View>
              <Text style={styles.guidanceText}>Different fruits from top/middle/bottom of batch</Text>
            </View>
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIconCircle}>
                <MaterialIcons name="blur-off" size={18} color={Colors.primaryDeep} />
              </View>
              <Text style={styles.guidanceText}>Avoid blurry photos — hold steady</Text>
            </View>
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIconCircle}>
                <MaterialIcons name="do-not-disturb" size={18} color={Colors.primaryDeep} />
              </View>
              <Text style={styles.guidanceText}>No duplicate fruits — each sample unique</Text>
            </View>
          </View>
        </GlassCard>

        {/* Proceed Button */}
        {canProceed && (
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={navigateToAnalysis}
            activeOpacity={0.85}
          >
            <Text style={styles.proceedButtonText}>Proceed to Analysis ({completedSamples} samples)</Text>
          </TouchableOpacity>
        )}

        {!canProceed && completedSamples > 0 && (
          <View style={styles.minSamplesNotice}>
            <MaterialIcons name="info" size={16} color={Colors.warning} />
            <Text style={styles.minSamplesText}>
              Need {SAMPLE_COUNT - completedSamples} more sample{SAMPLE_COUNT - completedSamples > 1 ? 's' : ''} for analysis (require {SAMPLE_COUNT})
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Crop Selector Modal */}
      <Modal
        visible={cropModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCropModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Crop Type</Text>
            {cropTypes.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[
                  styles.modalCropItem,
                  selectedCrop === crop && styles.modalCropItemSelected,
                ]}
                onPress={() => {
                  setSelectedCrop(crop);
                  setCropField(`${crop} - East Field`);
                  setCropModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalCropText,
                    selectedCrop === crop && styles.modalCropTextSelected,
                  ]}
                >
                  {crop}
                </Text>
                {selectedCrop === crop && (
                  <MaterialIcons name="check" size={20} color={Colors.primaryDeep} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCropModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Fallback Modal */}
      <Modal
        visible={showManualFallback}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualFallback(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual Agronomic Assessment</Text>
            <Text style={styles.manualFallbackNotice}>
              Use this when image capture fails. Results marked as manual assessment.
            </Text>

            <View style={styles.manualFallbackField}>
              <Text style={styles.manualFallbackFieldLabel}>Bruising Index (0-4)</Text>
              <View style={styles.manualFallbackSliderRow}>
                <Text style={styles.manualFallbackSliderValue}>{manualInputs.bruisingIndex}</Text>
                <Slider
                  style={styles.manualFallbackSlider}
                  value={manualInputs.bruisingIndex}
                  onValueChange={(v) => setManualInputs({ ...manualInputs, bruisingIndex: Math.round(v) })}
                  minimumValue={0}
                  maximumValue={4}
                  step={1}
                />
                <Text style={styles.manualFallbackSliderLabel}>
                  {['None', 'Light', 'Moderate', 'Heavy', 'Severe'][manualInputs.bruisingIndex]}
                </Text>
              </View>
            </View>

            <View style={styles.manualFallbackField}>
              <Text style={styles.manualFallbackFieldLabel}>Color Ripeness</Text>
              <View style={styles.manualFallbackSegmented}>
                {['Unripe', 'Optimal', 'Overripe'].map((r, i) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.manualFallbackSegment,
                      manualInputs.colorRipeness === i && styles.manualFallbackSegmentActive,
                    ]}
                    onPress={() => setManualInputs({ ...manualInputs, colorRipeness: i })}
                  >
                    <Text style={[
                      styles.manualFallbackSegmentText,
                      manualInputs.colorRipeness === i && styles.manualFallbackSegmentTextActive,
                    ]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.manualFallbackField}>
              <Text style={styles.manualFallbackFieldLabel}>Firmness</Text>
              <View style={styles.manualFallbackSegmented}>
                {['Soft', 'Firm', 'Hard'].map((f, i) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.manualFallbackSegment,
                      manualInputs.firmness === i && styles.manualFallbackSegmentActive,
                    ]}
                    onPress={() => setManualInputs({ ...manualInputs, firmness: i })}
                  >
                    <Text style={[
                      styles.manualFallbackSegmentText,
                      manualInputs.firmness === i && styles.manualFallbackSegmentTextActive,
                    ]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {processingError && (
              <Text style={styles.manualFallbackError}>{processingError}</Text>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowManualFallback(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, isProcessing && styles.modalButtonDisabled]}
                onPress={handleManualFallbackSubmit}
                disabled={isProcessing}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Assessment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default withErrorBoundary(ScanScreen, 'Scan');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 12,
    paddingBottom: 16,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    zIndex: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Typography.h4.fontSize,
    lineHeight: Typography.h4.lineHeight,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: Typography.small.fontSize,
    lineHeight: Typography.small.lineHeight,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeCropPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlass1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 14,
    gap: 6,
  },
  activeCropLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: Colors.primaryDeep,
    textTransform: 'uppercase',
  },
  activeCropValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.primaryDeep,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: '#1D1C16',
  },
  progressCount: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E7E2D9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7E2D9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E7E2D9',
  },
  progressStepDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressStepActive: {
    borderColor: '#93F8A6',
    borderWidth: 3,
  },
  progressStepNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#707A6F',
  },
  progressStepNumberDone: {
    color: '#FFFFFF',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E7E2D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    position: 'relative',
  },
  cameraPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#707A6F',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  framingGuide: {
    position: 'absolute',
    width: '84%',
    height: '78%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cornerMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  guideTopPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 8,
  },
  guideTopPillText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  guideBottomPill: {
    backgroundColor: '#93F8A6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#145C2E',
  },
  guideBottomPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: '#007233',
    textTransform: 'uppercase',
  },
  gpsBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 67, 29, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  gpsBadgeText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#FFFFFF',
  },
  gpsFallbackBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6C4',
  },
  gpsFallbackText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#8C620E',
  },
  gpsFallbackAction: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#145C2E',
    textDecorationLine: 'underline',
  },
  manualGpsInput: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  manualGpsLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#00431D',
    marginBottom: 12,
  },
  manualGpsFields: {
    flexDirection: 'row',
    gap: 12,
  },
  manualGpsField: {
    flex: 1,
  },
  manualGpsFieldLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#707A6F',
    marginBottom: 4,
  },
  manualGpsTextInput: {
    borderWidth: 1,
    borderColor: '#C0C9BD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#1D1C16',
  },
  scanControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  controlSecondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2EDE4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  captureMainButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  captureReady: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#93F8A6',
  },
  captureProcessing: {
    backgroundColor: '#707A6F',
  },
  captureInnerRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cropContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 8,
  },
  cropContextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cropContextIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CCEAD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropContextTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#00431D',
  },
  cropContextSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  manualFallbackTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F3EA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2EDE4',
  },
  manualFallbackText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: '#145C2E',
  },
  guidanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 16,
  },
  guidanceTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#00431D',
    marginBottom: 16,
  },
  guidanceList: {
    gap: 14,
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guidanceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCEAD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#1D1C16',
  },
  proceedButton: {
    backgroundColor: '#145C2E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2D3A28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  proceedButtonText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  minSamplesNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E6C4',
  },
  minSamplesText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#8C620E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#00431D',
    marginBottom: 8,
  },
  modalCropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F3EA',
  },
  modalCropItemSelected: {
    backgroundColor: '#CCEAD0',
  },
  modalCropText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#1D1C16',
  },
  modalCropTextSelected: {
    color: '#00431D',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: '#00431D',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  manualFallbackNotice: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#707A6F',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  manualFallbackField: {
    gap: 8,
  },
  manualFallbackFieldLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#1D1C16',
  },
  manualFallbackSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualFallbackSlider: {
    flex: 1,
    height: 40,
  },
  manualFallbackSliderValue: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#145C2E',
    width: 30,
  },
  manualFallbackSliderLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#707A6F',
    width: 60,
  },
  manualFallbackSegmented: {
    flexDirection: 'row',
    gap: 8,
  },
  manualFallbackSegment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2EDE4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  manualFallbackSegmentActive: {
    backgroundColor: '#145C2E',
    borderColor: '#145C2E',
  },
  manualFallbackSegmentText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#404940',
  },
  manualFallbackSegmentTextActive: {
    color: '#FFFFFF',
  },
  manualFallbackError: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#BA1A1A',
    marginTop: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F2EDE4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#404940',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#145C2E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
