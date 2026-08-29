import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
  Switch,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeafletMap from '../components/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { api, DashboardStats, Notification, PestScan } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
} from '../constants/theme';
import { FadeIn, ScaleIn, MotionTokens } from '../components/Animations';
import { useReducedMotion } from '../components/GlassPrimitives';
import SwitchMode from '../components/SwitchMode';
import { FarmerProfileCard, FarmerProfileData } from '../components/FarmerProfileCard';
import { ShowQr } from '../components/ShowQr';
import { FarmSatelliteFieldMap } from '../components/FarmSatelliteFieldMap';
import { PrecisionAgriCommandDashboard } from '../components/PrecisionAgriCommandDashboard';
import { hapticHeavy, hapticLight, hapticMedium } from '../utils/haptics';

import { FARMER_AVATAR, FARMER_NAME, FARMER_HANDLE, FARMER_LOCATION, FARMER_ROLE, FARMER_KISAN_ID } from '../constants/farmer';

const PROFILE_STORAGE_KEY = '@annapurna_farmer_profile';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, currentLanguageMeta, language } = useLanguage();
  const [farmCoords, setFarmCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 19.9975,
    longitude: 73.7898,
  });
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scans, setScans] = useState<PestScan[]>([]);
  const [showSatelliteDashboard, setShowSatelliteDashboard] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const reducedMotion = useReducedMotion();

  // Farmer profile editable state
  const [farmerData, setFarmerData] = useState<FarmerProfileData>({
    name: user?.username || 'Ramesh Patel',
    handle: `@${(user?.username || 'ramesh.patel').toLowerCase().replace(/\s+/g, '.')}`,
    avatarUrl: PROFILE_AVATAR,
    role: 'Lead Cultivator & Farm Manager • Tomato & Onion Specialist',
    farmLocation: 'East Field Area, Nashik Zone',
    joinedDate: 'December 2023',
    kisanId: 'ANN-98234',
    totalAcreage: '12.5 Acres',
    activeBatchesCount: 4,
    marketRating: '4.9 ★',
  });

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(farmerData.name);
  const [editLocation, setEditLocation] = useState(farmerData.farmLocation);
  const [editAcreage, setEditAcreage] = useState(farmerData.totalAcreage);
  const [editRole, setEditRole] = useState(farmerData.role);

  // Load saved profile data from storage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFarmerData((prev) => ({ ...prev, ...parsed }));
          setEditName(parsed.name || prevName(parsed));
          setEditLocation(parsed.farmLocation || prevLocation(parsed));
          setEditAcreage(parsed.totalAcreage || '12.5 Acres');
        }
      } catch (e) {
        console.warn('Failed to load profile:', e);
      }
    })();
  }, [user]);

  function prevName(p: any) { return p?.name || 'Ramesh Patel'; }
  function prevLocation(p: any) { return p?.farmLocation || 'East Field, Nashik'; }

  // Fetch GPS location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setFarmCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          const geocode = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geocode.length > 0) {
            const place = geocode[0];
            const locStr = `${place.city || place.district || 'Nashik'} Area, Maharashtra`;
            setFarmerData((prev) => ({ ...prev, farmLocation: locStr }));
          }
        }
      } catch {}
    })();
  }, []);

  // Fetch Dashboard Stats
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [dashRes, notifRes, scansRes] = await Promise.allSettled([
          api.dashboard.get(),
          api.notifications.list(),
          api.scans.list(),
        ]);
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value);
        if (scansRes.status === 'fulfilled') setScans(scansRes.value);
      } catch (e) {
        console.warn('Profile stats fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [isAuthenticated]);

  const handleSaveProfile = async () => {
    hapticHeavy();
    const updated: FarmerProfileData = {
      ...farmerData,
      name: editName.trim() || farmerData.name,
      handle: `@${editName.trim().toLowerCase().replace(/\s+/g, '.')}`,
      farmLocation: editLocation.trim() || farmerData.farmLocation,
      totalAcreage: editAcreage.trim() || farmerData.totalAcreage,
      role: editRole.trim() || farmerData.role,
    };
    setFarmerData(updated);
    setEditModalVisible(false);

    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Save profile error:', e);
    }
  };

  const handleShareProfile = async () => {
    hapticMedium();
    try {
      await Share.share({
        message: `🌾 Annapurna Verified Kisan Profile: ${farmerData.name} (Kisan ID: ${farmerData.kisanId})\nLocation: ${farmerData.farmLocation}\nLand Holding: ${farmerData.totalAcreage}\nMarket Rating: ${farmerData.marketRating}\nVerified via Annapurna AI Agri-Platform`,
      });
    } catch {}
  };

  const handleLogout = async () => {
    hapticLight();
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Annapurna?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const activeBatches = dashboard?.by_status?.find((s) => s.current_status === 'ACTIVE')?.batch_count ?? 4;
  const totalBatches = dashboard?.totals?.batch_count ?? 6;
  const savedPlans = dashboard?.by_crop_category?.length ?? 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Top App Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Profile</Text>
        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={styles.shareIconBtn}
            onPress={handleShareProfile}
            activeOpacity={0.7}
          >
            <MaterialIcons name="share" size={20} color="#145C2E" />
          </TouchableOpacity>
          <SwitchMode width={64} height={32} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Expandable Farmer Profile Card */}
        <FadeIn delay={50} duration={MotionTokens.duration.standard} direction="down" reducedMotion={reducedMotion}>
          <FarmerProfileCard
            farmer={{
              ...farmerData,
              activeBatchesCount: activeBatches,
            }}
            onEditPress={() => {
              setEditName(farmerData.name);
              setEditLocation(farmerData.farmLocation);
              setEditAcreage(farmerData.totalAcreage);
              setEditRole(farmerData.role);
              setEditModalVisible(true);
            }}
          />
        </FadeIn>

        {/* Digital Kisan QR Passport */}
        <FadeIn delay={75} duration={MotionTokens.duration.standard} direction="down" reducedMotion={reducedMotion}>
          <View style={{ alignItems: 'center', marginVertical: 4 }}>
            <ShowQr
              value={`KISAN_ID:${farmerData.kisanId}|NAME:${farmerData.name}|LOC:${farmerData.farmLocation}|ACRES:${farmerData.totalAcreage}`}
              buttonLabel="Show Kisan QR Passport"
            />
          </View>
        </FadeIn>

        {/* 3 Core Farm KPI Badges */}
        <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={reducedMotion}>
          <View style={styles.farmSummaryGrid}>
            <TouchableOpacity
              style={styles.farmStatCard}
              onPress={() => navigation?.navigate('CropBatches')}
              activeOpacity={0.8}
            >
              <Text style={styles.farmStatNumber}>{activeBatches}</Text>
              <Text style={styles.farmStatLabel}>Active Crops</Text>
              <View style={styles.statIndicatorDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.farmStatCard}
              onPress={() => navigation?.navigate('CropBatches')}
              activeOpacity={0.8}
            >
              <Text style={styles.farmStatNumber}>{totalBatches}</Text>
              <Text style={styles.farmStatLabel}>Total Batches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.farmStatCard}
              onPress={() => navigation?.navigate('Market')}
              activeOpacity={0.8}
            >
              <Text style={[styles.farmStatNumber, { color: '#145C2E' }]}>₹48.5K</Text>
              <Text style={styles.farmStatLabel}>Est. Revenue</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Satellite Farm Parcels & IoT Sensor Map Section */}
        {farmCoords && (
          <ScaleIn delay={150} duration={MotionTokens.duration.standard} reducedMotion={reducedMotion}>
            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <MaterialIcons name="satellite-alt" size={20} color="#145C2E" />
                  <View>
                    <Text style={styles.mapTitle}>Precision Farm Command & Sensors</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DrawAOI')}
                    style={styles.drawBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="fullscreen" size={16} color="#145C2E" />
                    <Text style={styles.drawBtnText}>Full Screen</Text>
                  </TouchableOpacity>
                  <Switch
                    value={showSatelliteDashboard}
                    onValueChange={(val) => {
                      hapticLight();
                      setShowSatelliteDashboard(val);
                    }}
                    trackColor={{ false: '#E5E7EB', true: '#C8E6C9' }}
                    thumbColor={showSatelliteDashboard ? '#145C2E' : '#9CA3AF'}
                  />
                </View>
              </View>

              {showSatelliteDashboard && (
                <PrecisionAgriCommandDashboard
                  farmName={farmerData.name + " Farm"}
                  location={farmerData.farmLocation}
                  initialLatitude={farmCoords.latitude}
                  initialLongitude={farmCoords.longitude}
                />
              )}
            </View>
          </ScaleIn>
        )}

        {/* Functional Menu List */}
        <FadeIn delay={200} duration={MotionTokens.duration.standard} direction="up" reducedMotion={reducedMotion}>
          <View style={styles.menuList}>
            {/* 1. Crop Batches */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => navigation?.navigate('CropBatches')}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialIcons name="inventory-2" size={20} color="#145C2E" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Manage Crop Batches</Text>
                  <Text style={styles.menuItemSub}>View active sowing, health & shelf-life</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 2. Smart Move Logistics */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => navigation?.navigate('SmartMove')}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialIcons name="local-shipping" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Smart Move Logistics</Text>
                  <Text style={styles.menuItemSub}>Transit profit simulator & truck booking</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 3. Notifications */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => navigation?.navigate('Notification')}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <MaterialIcons name="notifications-active" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Notifications & Alerts</Text>
                  <Text style={styles.menuItemSub}>Weather warnings & mandi price alerts</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 4. Language & Voice Assistant Preferences */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => navigation?.navigate('Language')}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialIcons name="record-voice-over" size={20} color="#7E22CE" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Language & Voice AI</Text>
                  <Text style={styles.menuItemSub}>Telugu, Hindi, Marathi, Tamil, English</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 5. Edit Profile Details */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => {
                setEditName(farmerData.name);
                setEditLocation(farmerData.farmLocation);
                setEditAcreage(farmerData.totalAcreage);
                setEditRole(farmerData.role);
                setEditModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#F3F4F6' }]}>
                  <MaterialIcons name="manage-accounts" size={20} color="#4B5563" />
                </View>
                <View>
                  <Text style={styles.menuItemLabel}>Edit Farmer Profile</Text>
                  <Text style={styles.menuItemSub}>Name, land holding, crops & contact</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 6. Logout */}
            <TouchableOpacity
              style={[styles.menuItemCard, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconCircle, { backgroundColor: '#FFEBEE' }]}>
                  <MaterialIcons name="logout" size={20} color="#C62828" />
                </View>
                <View>
                  <Text style={[styles.menuItemLabel, { color: '#C62828' }]}>Sign Out</Text>
                  <Text style={styles.menuItemSub}>Log out of your Annapurna account</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#C62828" />
            </TouchableOpacity>
          </View>
        </FadeIn>
      </ScrollView>

      {/* Edit Profile Full Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Edit Farmer Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Ramesh Patel"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Location / Village</Text>
                <TextInput
                  style={styles.inputField}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="e.g. East Field, Nashik Zone"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Total Land Holding (Acres)</Text>
                <TextInput
                  style={styles.inputField}
                  value={editAcreage}
                  onChangeText={setEditAcreage}
                  placeholder="e.g. 12.5 Acres"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization & Role</Text>
                <TextInput
                  style={[styles.inputField, { height: 60 }]}
                  value={editRole}
                  onChangeText={setEditRole}
                  placeholder="e.g. Lead Cultivator • Tomato & Onion Specialist"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Profile Updates</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 14,
  },
  farmSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  farmStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
  },
  farmStatNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  farmStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginTop: 4,
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  drawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  drawBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#145C2E',
  },
  menuList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
    overflow: 'hidden',
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  menuItemSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 20, 10, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
    marginBottom: 5,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#145C2E',
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: 12,
    marginBottom: 20,
  },
  saveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
