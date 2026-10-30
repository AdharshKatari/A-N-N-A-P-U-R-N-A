import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import LeafletMap, { MapMarker } from '../components/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { FadeInUp } from '../components/Animations';

const { width } = Dimensions.get('window');

interface SaplingVariety {
  name: string;
  category: 'Vegetable Seedling' | 'Grafted Fruit' | 'Hybrid Seeds' | 'Commercial Flora';
  trait: string;
  price: string;
  unit: string;
  readyForPickup: boolean;
}

interface NurseryHub {
  id: string;
  name: string;
  nurseryType: string;
  district: 'Madanapalle' | 'Tirupati' | 'Chittoor' | 'Angallu';
  address: string;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  phone: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  googleSearchUrl: string;
  isCertified: boolean;
  isOpen: boolean;
  timing: string;
  varieties: SaplingVariety[];
}

const NURSERIES_DATA: NurseryHub[] = [
  {
    id: 'nursery_1',
    name: 'Madanapalle Horticulture & Tomato Grafting Nursery',
    nurseryType: 'AP Horticulture Dept. Certified Center',
    district: 'Madanapalle',
    address: 'Besant Road, Near Horsley Hills Bypass, Madanapalle',
    distanceKm: 2.1,
    rating: 4.9,
    reviewsCount: 210,
    phone: '+919849112233',
    latitude: 13.5512,
    longitude: 78.5065,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Plant+Nursery+Besant+Road+Madanapalle',
    googleSearchUrl: 'https://www.google.com/search?q=Madanapalle+Tomato+Grafting+Plant+Nursery',
    isCertified: true,
    isOpen: true,
    timing: '6:30 AM – 7:30 PM',
    varieties: [
      {
        name: 'US-440 Grafted Tomato Saplings',
        category: 'Vegetable Seedling',
        trait: 'High Bacterial Wilt & Nematode Resistance',
        price: '₹3.50',
        unit: 'per sapling',
        readyForPickup: true,
      },
      {
        name: 'Abhinav Hybrid Tomato Seedlings',
        category: 'Vegetable Seedling',
        trait: 'Thick Skin, Long Distance Transit Durability',
        price: '₹2.80',
        unit: 'per seedling',
        readyForPickup: true,
      },
      {
        name: 'G4 Super-Pungent Green Chilli',
        category: 'Vegetable Seedling',
        trait: 'Virus Tolerant & Heavy Flush Yield',
        price: '₹1.80',
        unit: 'per seedling',
        readyForPickup: true,
      },
      {
        name: 'Red Lady 786 Dwarf Papaya',
        category: 'Grafted Fruit',
        trait: 'Early Fruiting & High Sugar Brix Content',
        price: '₹22.00',
        unit: 'per plant',
        readyForPickup: true,
      },
    ],
  },
  {
    id: 'nursery_2',
    name: 'Tirupati Green Valley Nursery & Agro Seed Hub',
    nurseryType: 'ICAR-IIHR Certified Commercial Nursery',
    district: 'Tirupati',
    address: 'Karakambadi Road, Near Agro ITI, Tirupati',
    distanceKm: 4.8,
    rating: 4.8,
    reviewsCount: 340,
    phone: '+919440224466',
    latitude: 13.6520,
    longitude: 79.4480,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Plant+Nursery+Karakambadi+Road+Tirupati',
    googleSearchUrl: 'https://www.google.com/search?q=Tirupati+Green+Valley+Plant+Nursery+Seeds',
    isCertified: true,
    isOpen: true,
    timing: '6:00 AM – 8:00 PM',
    varieties: [
      {
        name: 'Banganapalli Grafted Mango Plants',
        category: 'Grafted Fruit',
        trait: '2-Year Healthy Rootstock with High Yield',
        price: '₹160',
        unit: 'per plant',
        readyForPickup: true,
      },
      {
        name: 'Taiwan Pink Super Sweet Guava',
        category: 'Grafted Fruit',
        trait: 'All-Season Fruiting & High Pulp Ratio',
        price: '₹110',
        unit: 'per plant',
        readyForPickup: true,
      },
      {
        name: 'Bhima Super Hybrid Red Onion Seeds',
        category: 'Hybrid Seeds',
        trait: 'Uniform Bulb Size & 5-Month Storage Life',
        price: '₹850',
        unit: '500g pack',
        readyForPickup: true,
      },
      {
        name: 'Sindhu Seedless Mango Graft',
        category: 'Grafted Fruit',
        trait: 'Export Grade Premium Table Mango',
        price: '₹240',
        unit: 'per plant',
        readyForPickup: true,
      },
    ],
  },
  {
    id: 'nursery_3',
    name: 'Angallu Agro Horti Seedlings & Nursery',
    district: 'Angallu',
    nurseryType: 'Direct Farmer Grafting Cooperative',
    address: 'Horsley Hills Road, Angallu Junction',
    distanceKm: 8.4,
    rating: 4.7,
    reviewsCount: 98,
    phone: '+919701887766',
    latitude: 13.6080,
    longitude: 78.5810,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Plant+Nursery+Angallu+Andhra+Pradesh',
    googleSearchUrl: 'https://www.google.com/search?q=Angallu+Agro+Horti+Seedlings+Madanapalle',
    isCertified: true,
    isOpen: true,
    timing: '7:00 AM – 7:00 PM',
    varieties: [
      {
        name: 'Shivam Brinjal Seedlings',
        category: 'Vegetable Seedling',
        trait: 'Glossy Purple, Shoot Borer Tolerant',
        price: '₹1.50',
        unit: 'per seedling',
        readyForPickup: true,
      },
      {
        name: 'Kaveri Hybrid Watermelon Seeds',
        category: 'Hybrid Seeds',
        trait: 'Crisp Flesh, High Sugar 12% Brix',
        price: '₹480',
        unit: '50g pack',
        readyForPickup: true,
      },
      {
        name: 'VNR Bihi Giant Guava Sapling',
        category: 'Grafted Fruit',
        trait: 'Big Size 400g-800g Fruits',
        price: '₹135',
        unit: 'per plant',
        readyForPickup: true,
      },
    ],
  },
  {
    id: 'nursery_4',
    name: 'Chittoor District Hybrid Seed & Sapling Depot',
    nurseryType: 'Govt. Subsidized Seed Distribution Centre',
    district: 'Chittoor',
    address: 'Kattamanchi Road, Near Collectorate, Chittoor',
    distanceKm: 16.2,
    rating: 4.6,
    reviewsCount: 165,
    phone: '+919866443322',
    latitude: 13.2210,
    longitude: 79.1120,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Seed+Depot+Kattamanchi+Chittoor',
    googleSearchUrl: 'https://www.google.com/search?q=Chittoor+District+Hybrid+Seed+Depot',
    isCertified: true,
    isOpen: true,
    timing: '8:00 AM – 6:00 PM',
    varieties: [
      {
        name: 'Totapuri Processing Mango Grafts',
        category: 'Grafted Fruit',
        trait: 'High Pulp Recovery for Pulp Factories',
        price: '₹140',
        unit: 'per plant',
        readyForPickup: true,
      },
      {
        name: 'Teja Hot Hybrid Chilli Seeds (Syngenta)',
        category: 'Hybrid Seeds',
        trait: 'High Capsaicin Color Value ASTA 120+',
        price: '₹950',
        unit: '100g pack',
        readyForPickup: true,
      },
    ],
  },
];

export default function NurseriesScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNurseryId, setSelectedNurseryId] = useState<string>('nursery_1');

  // Filtered nurseries
  const filteredNurseries = NURSERIES_DATA.filter((nursery) => {
    const matchesDistrict = selectedDistrict === 'All' || nursery.district === selectedDistrict;
    const matchesSearch =
      nursery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nursery.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nursery.varieties.some(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.trait.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'All' ||
      nursery.varieties.some((v) => v.category === selectedCategory);

    return matchesDistrict && matchesSearch && matchesCategory;
  });

  // Map markers from nursery coordinates
  const mapMarkers: MapMarker[] = filteredNurseries.map((nursery) => ({
    id: nursery.id,
    latitude: nursery.latitude,
    longitude: nursery.longitude,
    title: nursery.name,
    subtitle: `⭐ ${nursery.rating} • ${nursery.distanceKm} km • ${nursery.varieties.length} varieties`,
    color: nursery.id === selectedNurseryId ? '#145C2E' : '#145C2E',
    icon: '🌱',
  }));

  const activeNursery = filteredNurseries.find((n) => n.id === selectedNurseryId) || filteredNurseries[0];

  const handleOpenGoogleMaps = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Could not open Google Maps:', err));
  };

  const handleOpenGoogleSearch = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Could not open Google Search:', err));
  };

  const handleCallNursery = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error('Could not dial phone:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('nurseries', 'Nearby Nurseries & Seed Hubs')}</Text>
          <Text style={styles.headerSubtitle}>Madanapalle • Tirupati • Angallu Region</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          activeOpacity={0.7}
          onPress={() => handleOpenGoogleSearch('https://www.google.com/search?q=plant+nurseries+and+seed+dealers+near+me')}
        >
          <MaterialCommunityIcons name="google" size={20} color={Colors.primaryDeep} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Interactive Map */}
        <FadeInUp delay={50} duration={400}>
          <View style={styles.mapCard}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapTitleGroup}>
                <MaterialIcons name="local-florist" size={20} color="#145C2E" />
                <Text style={styles.mapTitle}>Live Nurseries & Seedling Hubs</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredNurseries.length} Nurseries nearby</Text>
              </View>
            </View>

            <LeafletMap
              latitude={activeNursery ? activeNursery.latitude : 13.5512}
              longitude={activeNursery ? activeNursery.longitude : 78.5065}
              zoom={11}
              markers={mapMarkers}
              height={230}
              onMarkerPress={(id) => setSelectedNurseryId(id)}
            />

            <Text style={styles.mapHintText}>
              🌿 Tap any nursery pin to view available grafted varieties and sapling prices.
            </Text>
          </View>
        </FadeInUp>

        {/* Search & Location Filter Bar */}
        <FadeInUp delay={100} duration={400}>
          <View style={styles.searchBarContainer}>
            <MaterialIcons name="search" size={22} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search US-440 Tomato, Mango Grafts, Onion Seeds..."
              placeholderTextColor={Colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* District Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtScroll}
          >
            {['All', 'Madanapalle', 'Tirupati', 'Angallu', 'Chittoor'].map((district) => {
              const active = selectedDistrict === district;
              return (
                <TouchableOpacity
                  key={district}
                  style={[styles.districtPill, active && styles.districtPillActive]}
                  onPress={() => setSelectedDistrict(district)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.districtPillText, active && styles.districtPillTextActive]}>
                    {district === 'All' ? '🌱 All Nurseries' : district}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Plant Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {['All', 'Vegetable Seedling', 'Grafted Fruit', 'Hybrid Seeds'].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </FadeInUp>

        {/* Nursery Hub Listings */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeading}>
            Certified Nurseries & Seed Suppliers ({filteredNurseries.length})
          </Text>

          {filteredNurseries.map((nursery, index) => {
            const isSelected = nursery.id === selectedNurseryId;
            return (
              <FadeInUp key={nursery.id} delay={150 + index * 60} duration={450}>
                <TouchableOpacity
                  style={[styles.nurseryCard, isSelected && styles.nurseryCardSelected]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedNurseryId(nursery.id)}
                >
                  {/* Nursery Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.nurseryIconWrap}>
                        <MaterialIcons name="eco" size={22} color="#145C2E" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.nurseryName}>{nursery.name}</Text>
                          {nursery.isCertified && (
                            <View style={styles.certifiedBadge}>
                              <MaterialIcons name="verified" size={12} color="#145C2E" />
                              <Text style={styles.certifiedText}>Certified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.nurseryType}>{nursery.nurseryType}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.metaRow}>
                    <MaterialIcons name="location-on" size={16} color={Colors.textMuted} />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {nursery.address}
                    </Text>
                  </View>

                  {/* Badges */}
                  <View style={styles.badgesRow}>
                    <View style={styles.distanceBadge}>
                      <MaterialIcons name="near-me" size={14} color="#145C2E" />
                      <Text style={styles.distanceText}>{nursery.distanceKm} km away</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <MaterialIcons name="star" size={14} color="#D97706" />
                      <Text style={styles.ratingText}>{nursery.rating} ({nursery.reviewsCount})</Text>
                    </View>
                    <View style={styles.timingBadge}>
                      <Text style={styles.timingText}>{nursery.timing}</Text>
                    </View>
                  </View>

                  {/* Available Varieties & Seedling Price List */}
                  <View style={styles.varietiesSection}>
                    <Text style={styles.varietiesHeading}>Available Saplings & Seeds:</Text>
                    {nursery.varieties.map((v, vIdx) => (
                      <View key={vIdx} style={styles.varietyItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.varietyName}>{v.name}</Text>
                          <Text style={styles.varietyTrait}>Trait: {v.trait}</Text>
                        </View>
                        <View style={styles.priceColumn}>
                          <Text style={styles.varietyPrice}>{v.price}</Text>
                          <Text style={styles.varietyUnit}>{v.unit}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons: Google Maps Route, Search, Call */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.googleBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenGoogleMaps(nursery.googleMapsUrl)}
                    >
                      <MaterialIcons name="directions" size={18} color="#FFFFFF" />
                      <Text style={styles.googleBtnText}>Maps Route</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.googleSearchBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenGoogleSearch(nursery.googleSearchUrl)}
                    >
                      <MaterialCommunityIcons name="google" size={16} color={Colors.primaryDeep} />
                      <Text style={styles.googleSearchBtnText}>Google Search</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallNursery(nursery.phone)}
                    >
                      <MaterialIcons name="phone" size={18} color="#145C2E" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </FadeInUp>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  mapCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.dividerLight,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  mapTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: '#F5F3ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#145C2E',
  },
  mapHintText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  districtScroll: {
    paddingVertical: Spacing.xs,
    gap: 8,
  },
  districtPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  districtPillActive: {
    backgroundColor: '#145C2E',
    borderColor: '#145C2E',
  },
  districtPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  districtPillTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  categoryScroll: {
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  categoryPillActive: {
    backgroundColor: '#F5F3ED',
    borderWidth: 1,
    borderColor: '#145C2E',
  },
  categoryPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#145C2E',
    fontFamily: FontFamily.bold,
  },
  listSection: {
    marginTop: Spacing.xs,
  },
  sectionHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  nurseryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dividerLight,
    ...Shadows.card,
  },
  nurseryCardSelected: {
    borderColor: '#145C2E',
    borderWidth: 1.5,
    backgroundColor: '#FCFDFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  nurseryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  nurseryName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  certifiedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#145C2E',
  },
  nurseryType: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  addressText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#145C2E',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#B45309',
  },
  timingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timingText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#475569',
  },
  varietiesSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerLight,
  },
  varietiesHeading: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  varietyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  varietyName: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  varietyTrait: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  varietyPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#145C2E',
  },
  varietyUnit: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  googleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145C2E',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  googleBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  googleSearchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#145C2E',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  googleSearchBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.primaryDeep,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F5F3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
