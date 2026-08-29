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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, FontFamily, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import LeafletMap, { MapMarker } from '../components/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { FadeInUp } from '../components/Animations';

const { width } = Dimensions.get('window');

interface PesticideProduct {
  name: string;
  category: 'Insecticide' | 'Fungicide' | 'Bio-Control' | 'NPK Fertilizer' | 'Micronutrient';
  targetIssue: string;
  price: string;
  packSize: string;
  inStock: boolean;
}

interface CropCareStore {
  id: string;
  name: string;
  dealerType: string;
  district: 'Madanapalle' | 'Tirupati' | 'Chittoor' | 'Punganur';
  address: string;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  phone: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  googleSearchUrl: string;
  isGovtLicensed: boolean;
  isOpen: boolean;
  timing: string;
  products: PesticideProduct[];
}

const CROP_CARE_STORES_DATA: CropCareStore[] = [
  {
    id: 'store_1',
    name: 'Annapurna Agro-Care & Pesticides',
    dealerType: 'Authorized IFFCO & Syngenta Dealer',
    district: 'Madanapalle',
    address: 'CTM Road, Near APMC Tomato Market Yard, Madanapalle',
    distanceKm: 1.8,
    rating: 4.9,
    reviewsCount: 184,
    phone: '+919848022341',
    latitude: 13.5562,
    longitude: 78.5028,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pesticide+Dealers+CTM+Road+Madanapalle',
    googleSearchUrl: 'https://www.google.com/search?q=Annapurna+Agro+Pesticides+Madanapalle',
    isGovtLicensed: true,
    isOpen: true,
    timing: '7:00 AM – 8:30 PM',
    products: [
      {
        name: 'Coragen (Chlorantraniliprole 18.5% SC)',
        category: 'Insecticide',
        targetIssue: 'Tomato Fruit Borer & Shoot Borer',
        price: '₹920',
        packSize: '60 ml',
        inStock: true,
      },
      {
        name: 'Emamectin Benzoate 5% SG (Proclaim)',
        category: 'Insecticide',
        targetIssue: 'Helicoverpa & Caterpillar attack',
        price: '₹340',
        packSize: '100 g',
        inStock: true,
      },
      {
        name: 'Dithane M-45 (Mancozeb 75% WP)',
        category: 'Fungicide',
        targetIssue: 'Early Blight & Leaf Spot in Tomato',
        price: '₹280',
        packSize: '500 g',
        inStock: true,
      },
      {
        name: '19:19:19 NPK 100% Water Soluble',
        category: 'NPK Fertilizer',
        targetIssue: 'Vegetative Canopy & Fast Root Growth',
        price: '₹190',
        packSize: '1 kg',
        inStock: true,
      },
    ],
  },
  {
    id: 'store_2',
    name: 'Sri Balaji Kisan Fertilizers & Crop Care',
    dealerType: 'Govt. Subsidized Agro Service Centre',
    district: 'Tirupati',
    address: 'Renigunta Road, Opp. Rythu Bazaar, Tirupati',
    distanceKm: 3.4,
    rating: 4.8,
    reviewsCount: 230,
    phone: '+919440188920',
    latitude: 13.6385,
    longitude: 79.4312,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fertilizers+and+Pesticides+Renigunta+Road+Tirupati',
    googleSearchUrl: 'https://www.google.com/search?q=Sri+Balaji+Kisan+Fertilizers+Crop+Care+Tirupati',
    isGovtLicensed: true,
    isOpen: true,
    timing: '6:30 AM – 9:00 PM',
    products: [
      {
        name: 'Trichoderma Viride Bio-Fungicide',
        category: 'Bio-Control',
        targetIssue: 'Damping Off, Wilt & Root Rot in seedlings',
        price: '₹180',
        packSize: '1 kg',
        inStock: true,
      },
      {
        name: 'Pseudomonas Fluorescens Bio-Pesticide',
        category: 'Bio-Control',
        targetIssue: 'Bacterial Wilt & Leaf Blight',
        price: '₹210',
        packSize: '1 L',
        inStock: true,
      },
      {
        name: 'Neem Oil 10,000 PPM (Azadirachtin)',
        category: 'Bio-Control',
        targetIssue: 'Whitefly, Thrips & Aphids (Organic)',
        price: '₹420',
        packSize: '1 L',
        inStock: true,
      },
      {
        name: 'Chelated Zinc EDTA 12% + Boron 20%',
        category: 'Micronutrient',
        targetIssue: 'Fruit Cracking & Blossom End Rot',
        price: '₹240',
        packSize: '250 g',
        inStock: true,
      },
    ],
  },
  {
    id: 'store_3',
    name: 'Kisan Seva Kendra & Pest Clinic',
    dealerType: 'Bayer & Dhanuka Certified Dealer',
    district: 'Madanapalle',
    address: 'Besant Road, Near Market Junction, Madanapalle',
    distanceKm: 2.3,
    rating: 4.7,
    reviewsCount: 112,
    phone: '+919885544122',
    latitude: 13.5480,
    longitude: 78.5085,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kisan+Seva+Kendra+Pesticides+Besant+Road+Madanapalle',
    googleSearchUrl: 'https://www.google.com/search?q=Kisan+Seva+Kendra+Pest+Clinic+Madanapalle',
    isGovtLicensed: true,
    isOpen: true,
    timing: '7:30 AM – 8:00 PM',
    products: [
      {
        name: 'Confidor (Imidacloprid 17.8% SL)',
        category: 'Insecticide',
        targetIssue: 'Sucking Pests & Leaf Curl Virus Vectors',
        price: '₹310',
        packSize: '100 ml',
        inStock: true,
      },
      {
        name: 'Ridomil Gold (Metalaxyl-M + Mancozeb)',
        category: 'Fungicide',
        targetIssue: 'Late Blight & Downy Mildew Protection',
        price: '₹560',
        packSize: '250 g',
        inStock: true,
      },
      {
        name: 'Calcium Nitrate + Boron Granules',
        category: 'NPK Fertilizer',
        targetIssue: 'Firm Fruit Skin & Extended Shelf-Life',
        price: '₹380',
        packSize: '5 kg',
        inStock: true,
      },
    ],
  },
  {
    id: 'store_4',
    name: 'Rythu Mitra Agro Chemicals & Bio-Inputs',
    dealerType: 'FPO Partnered Bulk Supplier',
    district: 'Chittoor',
    address: 'APMC Market Road, Kongareddy Palli, Chittoor',
    distanceKm: 14.5,
    rating: 4.8,
    reviewsCount: 156,
    phone: '+919490332211',
    latitude: 13.2172,
    longitude: 79.1003,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Agro+Chemicals+APMC+Market+Chittoor',
    googleSearchUrl: 'https://www.google.com/search?q=Rythu+Mitra+Agro+Chemicals+Chittoor',
    isGovtLicensed: true,
    isOpen: true,
    timing: '7:00 AM – 8:30 PM',
    products: [
      {
        name: 'Amistar Top (Azoxystrobin + Difenoconazole)',
        category: 'Fungicide',
        targetIssue: 'Anthracnose & Powdery Mildew',
        price: '₹780',
        packSize: '200 ml',
        inStock: true,
      },
      {
        name: 'Humic Acid 98% Potassium Humate',
        category: 'Bio-Control',
        targetIssue: 'Root Development & Soil Conditioning',
        price: '₹290',
        packSize: '1 kg',
        inStock: true,
      },
      {
        name: 'Spinetoram 11.7% SC (Delegate)',
        category: 'Insecticide',
        targetIssue: 'Severe Thrips & Leafminer Infestation',
        price: '₹890',
        packSize: '100 ml',
        inStock: true,
      },
    ],
  },
  {
    id: 'store_5',
    name: 'Punganur Agro Chemicals & Spray Equipment',
    dealerType: 'Agro Retailer & Battery Sprayer Hub',
    district: 'Punganur',
    address: 'Main Bazaar Road, Near Bus Stand, Punganur',
    distanceKm: 22.0,
    rating: 4.6,
    reviewsCount: 94,
    phone: '+919701223344',
    latitude: 13.3667,
    longitude: 78.5833,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Agro+Chemicals+Main+Bazaar+Punganur',
    googleSearchUrl: 'https://www.google.com/search?q=Punganur+Agro+Chemicals+Pesticides',
    isGovtLicensed: true,
    isOpen: false,
    timing: '8:00 AM – 7:30 PM',
    products: [
      {
        name: 'Chlorpyrifos 50% + Cypermethrin 5% EC',
        category: 'Insecticide',
        targetIssue: 'Soil Cutworms & Chewing Caterpillars',
        price: '₹460',
        packSize: '1 L',
        inStock: true,
      },
      {
        name: '16L 12V Battery Agro Sprayer (Double Motor)',
        category: 'NPK Fertilizer',
        targetIssue: 'Uniform Foliar Spray Application',
        price: '₹2,650',
        packSize: '1 Unit',
        inStock: true,
      },
    ],
  },
];

export default function CropCareStoresScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store_1');

  // Filtered stores
  const filteredStores = CROP_CARE_STORES_DATA.filter((store) => {
    const matchesDistrict = selectedDistrict === 'All' || store.district === selectedDistrict;
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.products.some(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.targetIssue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'All' ||
      store.products.some((p) => p.category === selectedCategory);

    return matchesDistrict && matchesSearch && matchesCategory;
  });

  // Map markers from store locations
  const mapMarkers: MapMarker[] = filteredStores.map((store) => ({
    id: store.id,
    latitude: store.latitude,
    longitude: store.longitude,
    title: store.name,
    subtitle: `⭐ ${store.rating} • ${store.distanceKm} km • ${store.products.length} products`,
    color: store.id === selectedStoreId ? '#145C2E' : '#4A803D',
    icon: '🧪',
  }));

  const activeStore = filteredStores.find((s) => s.id === selectedStoreId) || filteredStores[0];

  const handleOpenGoogleMaps = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Could not open Google Maps:', err));
  };

  const handleOpenGoogleSearch = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Could not open Google Search:', err));
  };

  const handleCallDealer = (phone: string) => {
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
          <Text style={styles.headerTitle}>{t('crop_care_stores', 'Crop-Care & Pesticide Stores')}</Text>
          <Text style={styles.headerSubtitle}>Madanapalle • Tirupati • Chittoor Region</Text>
        </View>
        <TouchableOpacity
          style={styles.headerActionBtn}
          activeOpacity={0.7}
          onPress={() => handleOpenGoogleSearch('https://www.google.com/search?q=pesticide+and+fertilizer+dealers+near+me')}
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
                <MaterialIcons name="pin-drop" size={20} color={Colors.primaryDeep} />
                <Text style={styles.mapTitle}>Live Store Locations & Radius</Text>
              </View>
              <View style={styles.storeCountBadge}>
                <Text style={styles.storeCountText}>{filteredStores.length} Stores nearby</Text>
              </View>
            </View>

            <LeafletMap
              latitude={activeStore ? activeStore.latitude : 13.5562}
              longitude={activeStore ? activeStore.longitude : 78.5028}
              zoom={11}
              markers={mapMarkers}
              height={230}
              onMarkerPress={(id) => setSelectedStoreId(id)}
            />

            <Text style={styles.mapHintText}>
              💡 Tap any marker on the map to view instant stock and pesticide prices.
            </Text>
          </View>
        </FadeInUp>

        {/* Search & Location Filter Bar */}
        <FadeInUp delay={100} duration={400}>
          <View style={styles.searchBarContainer}>
            <MaterialIcons name="search" size={22} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search store, Coragen, NPK, Blight, Neem..."
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
            {['All', 'Madanapalle', 'Tirupati', 'Chittoor', 'Punganur'].map((district) => {
              const active = selectedDistrict === district;
              return (
                <TouchableOpacity
                  key={district}
                  style={[styles.districtPill, active && styles.districtPillActive]}
                  onPress={() => setSelectedDistrict(district)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.districtPillText, active && styles.districtPillTextActive]}>
                    {district === 'All' ? '📍 All Regions' : district}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Product Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {['All', 'Insecticide', 'Fungicide', 'Bio-Control', 'NPK Fertilizer', 'Micronutrient'].map((cat) => {
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

        {/* Store Listings */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeading}>
            Verified Pesticide & Fertilizer Dealers ({filteredStores.length})
          </Text>

          {filteredStores.map((store, index) => {
            const isSelected = store.id === selectedStoreId;
            return (
              <FadeInUp key={store.id} delay={150 + index * 60} duration={450}>
                <TouchableOpacity
                  style={[styles.storeCard, isSelected && styles.storeCardSelected]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedStoreId(store.id)}
                >
                  {/* Top Store Header */}
                  <View style={styles.storeHeader}>
                    <View style={styles.storeHeaderLeft}>
                      <View style={styles.storeIconWrap}>
                        <MaterialCommunityIcons name="storefront" size={22} color={Colors.primaryDeep} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.storeTitleRow}>
                          <Text style={styles.storeName}>{store.name}</Text>
                          {store.isGovtLicensed && (
                            <View style={styles.licensedBadge}>
                              <MaterialIcons name="verified" size={12} color="#15803D" />
                              <Text style={styles.licensedText}>Licensed</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dealerType}>{store.dealerType}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Address & Distance */}
                  <View style={styles.storeMetaRow}>
                    <MaterialIcons name="location-on" size={16} color={Colors.textMuted} />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {store.address}
                    </Text>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={styles.distanceBadge}>
                      <MaterialIcons name="near-me" size={14} color="#166534" />
                      <Text style={styles.distanceText}>{store.distanceKm} km away</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <MaterialIcons name="star" size={14} color="#D97706" />
                      <Text style={styles.ratingText}>{store.rating} ({store.reviewsCount})</Text>
                    </View>
                    <View style={[styles.timingBadge, { backgroundColor: store.isOpen ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={[styles.timingText, { color: store.isOpen ? '#15803D' : '#B91C1C' }]}>
                        {store.isOpen ? '● Open Now' : '● Closed'}
                      </Text>
                    </View>
                  </View>

                  {/* Product & Price Catalog */}
                  <View style={styles.productCatalogSection}>
                    <Text style={styles.catalogHeading}>Available Pesticides & Fertilizers:</Text>
                    {store.products.map((prod, pIdx) => (
                      <View key={pIdx} style={styles.productItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productName}>{prod.name}</Text>
                          <Text style={styles.productIssue}>Target: {prod.targetIssue}</Text>
                        </View>
                        <View style={styles.productPriceCol}>
                          <Text style={styles.productPrice}>{prod.price}</Text>
                          <Text style={styles.productPack}>{prod.packSize}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons: Google Maps, Search, Call */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.googleBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenGoogleMaps(store.googleMapsUrl)}
                    >
                      <MaterialIcons name="directions" size={18} color="#FFFFFF" />
                      <Text style={styles.googleBtnText}>Maps Route</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.googleSearchBtn}
                      activeOpacity={0.8}
                      onPress={() => handleOpenGoogleSearch(store.googleSearchUrl)}
                    >
                      <MaterialCommunityIcons name="google" size={16} color={Colors.primaryDeep} />
                      <Text style={styles.googleSearchBtnText}>Google Search</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallDealer(store.phone)}
                    >
                      <MaterialIcons name="phone" size={18} color="#166534" />
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
  storeCountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  storeCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#15803D',
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
    ...Shadows.subtle,
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
    backgroundColor: Colors.primaryDeep,
    borderColor: Colors.primaryDeep,
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
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  categoryPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#15803D',
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
  storeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dividerLight,
    ...Shadows.card,
  },
  storeCardSelected: {
    borderColor: Colors.primaryDeep,
    borderWidth: 1.5,
    backgroundColor: '#FCFDFB',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  storeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  storeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  storeName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  licensedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  licensedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  dealerType: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  storeMetaRow: {
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
    color: '#166534',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
  },
  productCatalogSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerLight,
  },
  catalogHeading: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  productName: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  productIssue: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  productPriceCol: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#15803D',
  },
  productPack: {
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
    backgroundColor: '#15803D',
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
    borderColor: '#BBF7D0',
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
