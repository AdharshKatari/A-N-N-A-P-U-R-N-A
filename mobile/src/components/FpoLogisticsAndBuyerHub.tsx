import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ViewStyle,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, BorderRadius, Shadows } from '../constants/theme';
import { hapticHeavy, hapticLight, hapticMedium } from '../utils/haptics';

export interface FpoHubProps {
  cropType?: string;
  farmerWeightKg?: number;
  originVillage?: string;
  targetMandi?: string;
  style?: ViewStyle;
  onSelectBuyer?: (buyerName: string, floorPrice: number) => void;
  onBookColdStorage?: (facilityName: string) => void;
}

type TabType = 'pooling' | 'b2b_buyers' | 'cold_storage';

export function FpoLogisticsAndBuyerHub({
  cropType = 'Tomato (Roma)',
  farmerWeightKg = 500,
  originVillage = 'Dindori, Nashik',
  targetMandi = 'Vashi Navi Mumbai Terminal',
  style,
  onSelectBuyer,
  onBookColdStorage,
}: FpoHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pooling');
  const [poolJoined, setPoolJoined] = useState<boolean>(false);
  const [lockedBuyer, setLockedBuyer] = useState<string | null>(null);
  const [bookedStorage, setBookedStorage] = useState<string | null>(null);

  const handleJoinPool = () => {
    hapticHeavy();
    setPoolJoined(true);
    Alert.alert(
      '🎉 Shared Truck Confirmed!',
      `You joined the Mahindra Bolero pool to ${targetMandi}.\n\nPickup Time: Today at 09:30 AM\nYour Freight: ₹850 (You saved ₹2,950!)`,
      [{ text: 'Great!' }]
    );
  };

  const handleLockBuyer = (name: string, price: number) => {
    hapticMedium();
    setLockedBuyer(name);
    if (onSelectBuyer) onSelectBuyer(name, price);
    Alert.alert(
      '📝 Direct Contract Locked!',
      `Guaranteed floor price of ₹${price}/kg locked with ${name}.\nPresent your Kisan QR code at the gate for instant weighment & UPI payout.`,
      [{ text: 'View QR Passport' }]
    );
  };

  const handleReserveStorage = (facility: string) => {
    hapticMedium();
    setBookedStorage(facility);
    if (onBookColdStorage) onBookColdStorage(facility);
    Alert.alert(
      '❄️ Solar Cold Room Reserved!',
      `10 Crates reserved at ${facility}.\nRate: ₹0.80/kg/week (50% PM-FME Subsidy applied).`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeCircle}>
            <MaterialIcons name="local-shipping" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>FPO Commercialization Hub</Text>
            <Text style={styles.headerSub}>Shared Freight, B2B Off-takers & Plan-B Storage</Text>
          </View>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveTagText}>LIVE DISPATCH</Text>
        </View>
      </View>

      {/* 3-Tab Navigator */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pooling' && styles.tabBtnActive]}
          onPress={() => {
            hapticLight();
            setActiveTab('pooling');
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="group"
            size={16}
            color={activeTab === 'pooling' ? '#145C2E' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'pooling' && styles.tabTextActive]}>
            Truck Pool
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'b2b_buyers' && styles.tabBtnActive]}
          onPress={() => {
            hapticLight();
            setActiveTab('b2b_buyers');
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="storefront"
            size={16}
            color={activeTab === 'b2b_buyers' ? '#145C2E' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'b2b_buyers' && styles.tabTextActive]}>
            Direct B2B
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'cold_storage' && styles.tabBtnActive]}
          onPress={() => {
            hapticLight();
            setActiveTab('cold_storage');
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="ac-unit"
            size={16}
            color={activeTab === 'cold_storage' ? '#145C2E' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'cold_storage' && styles.tabTextActive]}>
            Plan-B Storage
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: FPO SHARED TRUCK POOL */}
      {activeTab === 'pooling' && (
        <View style={styles.tabContent}>
          <View style={styles.poolCard}>
            <View style={styles.poolCardTop}>
              <View>
                <Text style={styles.truckName}>Mahindra Bolero Maxi Truck (MH-15-EC-4910)</Text>
                <Text style={styles.routeText}>
                  {originVillage} ➔ {targetMandi} (168 km)
                </Text>
              </View>
              <View style={styles.departureBadge}>
                <Text style={styles.departureText}>Departs 09:30 AM</Text>
              </View>
            </View>

            {/* Capacity Progress Bar */}
            <View style={styles.capacitySection}>
              <View style={styles.capacityHeader}>
                <Text style={styles.capacityLabel}>Current Truck Payload Capacity</Text>
                <Text style={styles.capacityNumbers}>
                  {poolJoined ? '1,800 kg / 2,000 kg (90%)' : '1,300 kg / 2,000 kg (65%)'}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: poolJoined ? '90%' : '65%', backgroundColor: '#22C55E' },
                  ]}
                />
              </View>
            </View>

            {/* Co-Shippers List */}
            <View style={styles.coShippersList}>
              <Text style={styles.coShippersTitle}>Participating Co-Shippers (Your FPO Group):</Text>
              
              <View style={styles.shipperRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>SP</Text>
                </View>
                <View style={styles.shipperInfo}>
                  <Text style={styles.shipperName}>Suresh Patil (Dindori Village)</Text>
                  <Text style={styles.shipperSub}>600 kg Tomato Roma • Crates pre-loaded</Text>
                </View>
                <Text style={styles.shipperShare}>₹1,020</Text>
              </View>

              <View style={styles.shipperRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarText}>GD</Text>
                </View>
                <View style={styles.shipperInfo}>
                  <Text style={styles.shipperName}>Ganesh Deshmukh (Pimpalgaon)</Text>
                  <Text style={styles.shipperSub}>700 kg Tomato Roma • Crates pre-loaded</Text>
                </View>
                <Text style={styles.shipperShare}>₹1,190</Text>
              </View>

              {/* Your Slot */}
              <View style={[styles.shipperRow, styles.yourSlotRow]}>
                <View style={[styles.avatarMini, { backgroundColor: '#145C2E' }]}>
                  <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>YOU</Text>
                </View>
                <View style={styles.shipperInfo}>
                  <Text style={styles.yourName}>You (Ramesh Patel)</Text>
                  <Text style={styles.shipperSub}>{farmerWeightKg} kg Tomato • Verified Grade-A</Text>
                </View>
                <Text style={styles.yourShare}>₹850</Text>
              </View>
            </View>

            {/* Freight Cost Comparison Widget */}
            <View style={styles.savingsBox}>
              <View style={styles.savingsCol}>
                <Text style={styles.savingsLabel}>Solo Private Truck</Text>
                <Text style={styles.soloPrice}>₹3,800</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#145C2E" />
              <View style={styles.savingsCol}>
                <Text style={styles.savingsLabel}>FPO Shared Pool</Text>
                <Text style={styles.poolPrice}>₹850</Text>
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>SAVE ₹2,950 (78%)</Text>
              </View>
            </View>

            {/* Action Trigger */}
            <TouchableOpacity
              style={[styles.joinBtn, poolJoined && styles.joinedBtn]}
              onPress={handleJoinPool}
              disabled={poolJoined}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={poolJoined ? 'check-circle' : 'group-add'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.joinBtnText}>
                {poolJoined ? 'Shared Truck Reserved & Scheduled' : 'Join Shared Truck (₹850)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB 2: DIRECT B2B INSTITUTIONAL BUYERS */}
      {activeTab === 'b2b_buyers' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionInfo}>
            Guaranteed floor contracts with verified institutional off-takers. Scan your Kisan QR at the gate for instant settlement without mandi middlemen:
          </Text>

          {/* Buyer 1: Kissan HUL */}
          <View style={styles.buyerCard}>
            <View style={styles.buyerHeader}>
              <View>
                <Text style={styles.buyerName}>🏭 Kissan (Hindustan Unilever Paste Plant)</Text>
                <Text style={styles.buyerLocation}>Nashik Food Processing Zone (14 km)</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceVal}>₹28.00</Text>
                <Text style={styles.priceUnit}>/ kg guaranteed</Text>
              </View>
            </View>
            <View style={styles.buyerSpecs}>
              <Text style={styles.specItem}>✅ AGMARK Score {'>'} 75</Text>
              <Text style={styles.specItem}>⚡ Instant UPI Gate Settlement</Text>
              <Text style={styles.specItem}>📦 0% Commission Fee</Text>
            </View>
            <TouchableOpacity
              style={[styles.lockBtn, lockedBuyer === 'Kissan' && styles.lockedBtn]}
              onPress={() => handleLockBuyer('Kissan (HUL Plant)', 28.0)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="lock" size={16} color="#FFFFFF" />
              <Text style={styles.lockBtnText}>
                {lockedBuyer === 'Kissan (HUL Plant)' ? 'Floor Price Locked (₹28/kg)' : 'Lock Direct Floor Contract'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buyer 2: Reliance Fresh Direct Terminal */}
          <View style={styles.buyerCard}>
            <View style={styles.buyerHeader}>
              <View>
                <Text style={styles.buyerName}>🛒 Reliance Fresh Direct Mandi Terminal</Text>
                <Text style={styles.buyerLocation}>Thane-Mumbai Logistics Hub (145 km)</Text>
              </View>
              <View style={[styles.priceTag, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.priceVal, { color: '#0369A1' }]}>₹33.50</Text>
                <Text style={styles.priceUnit}>/ kg premium</Text>
              </View>
            </View>
            <View style={styles.buyerSpecs}>
              <Text style={styles.specItem}>✅ AGMARK Score {'>'} 82 (Grade-A)</Text>
              <Text style={styles.specItem}>⚡ T+0 Same Day Bank Credit</Text>
              <Text style={styles.specItem}>🛡️ Digital QC Passport Accepted</Text>
            </View>
            <TouchableOpacity
              style={[styles.lockBtn, { backgroundColor: '#0284C7' }, lockedBuyer === 'Reliance Fresh' && styles.lockedBtn]}
              onPress={() => handleLockBuyer('Reliance Fresh', 33.5)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="lock" size={16} color="#FFFFFF" />
              <Text style={styles.lockBtnText}>
                {lockedBuyer === 'Reliance Fresh' ? 'Floor Price Locked (₹33.50/kg)' : 'Lock Premium Retail Contract'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB 3: EMERGENCY SOLAR COLD STORAGE PLAN-B */}
      {activeTab === 'cold_storage' && (
        <View style={styles.tabContent}>
          <View style={styles.coldStorageAlert}>
            <MaterialIcons name="security" size={22} color="#0284C7" />
            <Text style={styles.coldStorageAlertText}>
              If spot prices crash below ₹18/kg, protect your crop in decentralized solar micro-cold rooms for up to 21 days instead of distress selling.
            </Text>
          </View>

          {/* Cold Room Facility */}
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <View>
                <Text style={styles.storageTitle}>❄️ Dindori Agri-Solar Cold Room</Text>
                <Text style={styles.storageSub}>Govt PM-FME Certified Hub • 8.5 km from your farm</Text>
              </View>
              <View style={styles.tempBadge}>
                <Text style={styles.tempText}>4°C ± 0.5°C</Text>
              </View>
            </View>

            <View style={styles.storageMetrics}>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>42 Crates</Text>
                <Text style={styles.metricSub}>Available Space</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>₹0.80/kg</Text>
                <Text style={styles.metricSub}>Weekly Fee (50% Subsidy)</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>21 Days</Text>
                <Text style={styles.metricSub}>Max Shelf Extension</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.reserveBtn, bookedStorage && styles.reservedBtn]}
              onPress={() => handleReserveStorage('Dindori Agri-Solar Cold Room')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="ac-unit" size={18} color="#FFFFFF" />
              <Text style={styles.reserveBtnText}>
                {bookedStorage ? 'Cold Room Space Reserved' : 'Emergency 1-Tap Space Reservation'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F2916',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E5E2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#86EFAC',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    fontWeight: '700',
    color: '#22C55E',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.card,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#145C2E',
  },
  tabContent: {
    padding: 14,
  },
  poolCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  poolCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  truckName: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  routeText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  departureBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  departureText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  capacitySection: {
    gap: 4,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  capacityNumbers: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  coShippersList: {
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
  },
  coShippersTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#475569',
  },
  shipperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  yourSlotRow: {
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  shipperInfo: {
    flex: 1,
  },
  shipperName: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#1E293B',
  },
  yourName: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#065F46',
  },
  shipperSub: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#64748B',
  },
  shipperShare: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#475569',
  },
  yourShare: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#047857',
  },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  savingsCol: {
    alignItems: 'center',
  },
  savingsLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#475569',
  },
  soloPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  poolPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  savingsBadge: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  savingsBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#145C2E',
    borderRadius: 12,
    paddingVertical: 12,
    ...Shadows.card,
  },
  joinedBtn: {
    backgroundColor: '#059669',
  },
  joinBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionInfo: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  buyerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 8,
  },
  buyerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buyerName: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: 200,
  },
  buyerLocation: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  priceTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  priceVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  priceUnit: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: '#92400E',
  },
  buyerSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specItem: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: '#475569',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803D',
    borderRadius: 10,
    paddingVertical: 9,
  },
  lockedBtn: {
    backgroundColor: '#047857',
  },
  lockBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coldStorageAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 10,
  },
  coldStorageAlertText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 15,
  },
  storageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storageTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  storageSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  tempBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tempText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#0284C7',
  },
  storageMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  metricSub: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: '#64748B',
  },
  reserveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 10,
  },
  reservedBtn: {
    backgroundColor: '#0369A1',
  },
  reserveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
