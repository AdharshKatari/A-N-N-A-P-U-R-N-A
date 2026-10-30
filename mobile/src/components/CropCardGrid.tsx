import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CropCardItem {
  id: string;
  title: string;
  batchCount: number;
  totalWeightKg: number;
  status?: string;
}

interface CropCardGridProps {
  crops: CropCardItem[];
  activeBatches: number;
  healthScore?: number;
  onViewDetails: (crop: CropCardItem) => void;
  onManage: (crop: CropCardItem) => void;
}

const COLORS = ['#145C2E', '#D97732', '#8A6A3E', '#145C2E', '#B48A32'];
const cropIcon = (title: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const value = title.toLowerCase();
  if (value.includes('tomato')) return 'food-apple';
  if (value.includes('potato')) return 'circle-slice-8';
  if (value.includes('onion')) return 'circle-outline';
  if (value.includes('wheat') || value.includes('paddy')) return 'barley';
  if (value.includes('mango')) return 'fruit-cherries';
  return 'sprout';
};

export default function CropCardGrid({
  crops, activeBatches, healthScore = 0, onViewDetails, onManage,
}: CropCardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = crops.find((crop) => crop.id === activeId);
  const secondary = active ? crops.filter((crop) => crop.id !== active.id) : crops;
  const select = (id: string | null) => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveId(id);
  };
  if (!crops.length) return null;
  return (
    <View style={styles.root}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>YOUR CROPS</Text>
          <Text style={styles.heading}>Growing overview</Text>
        </View>
        {active && (
          <Pressable accessibilityRole="button" accessibilityLabel="Collapse crop details"
            onPress={() => select(null)} style={styles.collapseButton}>
            <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {active && (
        <View style={[styles.expandedCard, { backgroundColor: COLORS[crops.indexOf(active) % COLORS.length] }]}>
          <View style={styles.expandedTop}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name={cropIcon(active.title)} size={35} color="#FFFFFF" />
            </View>
            <Pressable onPress={() => onManage(active)} style={({ pressed }) => [styles.glassButton, pressed && styles.pressed]}>
              <Text style={styles.glassButtonText}>Manage</Text>
            </Pressable>
          </View>
          <View>
            <Text style={styles.expandedTitle}>{active.title}</Text>
            <Text style={styles.expandedSubtitle}>{active.batchCount} batches · {Math.round(active.totalWeightKg).toLocaleString('en-IN')} kg</Text>
          </View>
          <View style={styles.expandedDetails}>
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>ACTIVE BATCHES</Text>
              <Text style={styles.detailValue}>{activeBatches}</Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>HEALTH</Text>
              <Text style={styles.detailValue}>{healthScore >= 70 ? 'Good' : healthScore > 0 ? 'Watch' : 'Pending'}</Text>
            </View>
          </View>
          <Pressable onPress={() => onViewDetails(active)} style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}>
            <Text style={styles.detailsButtonText}>View Details</Text>
            <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <View style={[styles.grid, active && styles.gridCompact]}>
        {secondary.map((crop, index) => {
          const sourceIndex = crops.indexOf(crop);
          return (
            <Pressable key={crop.id} onPress={() => select(crop.id)}
              style={({ pressed }) => [
                styles.cropCard,
                active ? styles.cropCardCompact : styles.cropCardRegular,
                { backgroundColor: COLORS[sourceIndex % COLORS.length] },
                pressed && styles.pressed,
              ]}>
              <View style={styles.smallTop}>
                <MaterialCommunityIcons name={cropIcon(crop.title)} size={active ? 20 : 28} color="#FFFFFF" />
                <View style={styles.moreCircle}><MaterialIcons name="more-horiz" size={15} color="#FFFFFF" /></View>
              </View>
              <View>
                <Text numberOfLines={1} style={[styles.cropName, active && styles.compactText]}>{crop.title}</Text>
                <Text numberOfLines={1} style={[styles.cropMeta, active && styles.compactText]}>
                  {crop.batchCount} {crop.batchCount === 1 ? 'Batch' : 'Batches'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: FontFamily.bold, fontSize: 10, letterSpacing: 1, color: Colors.primaryDeep },
  heading: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textPrimary, marginTop: 2 },
  collapseButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  expandedCard: { minHeight: 245, borderRadius: 28, padding: 18, justifyContent: 'space-between', ...Shadows.glass2 },
  expandedTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' },
  glassButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.22)' },
  glassButtonText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFFFFF' },
  expandedTitle: { fontFamily: FontFamily.bold, fontSize: 26, color: '#FFFFFF' },
  expandedSubtitle: { fontFamily: FontFamily.semibold, fontSize: 14, color: 'rgba(255,255,255,.72)', marginTop: 2 },
  expandedDetails: { flexDirection: 'row', gap: 10 },
  detail: { flex: 1, padding: 10, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.12)' },
  detailLabel: { fontFamily: FontFamily.bold, fontSize: 9, letterSpacing: .6, color: 'rgba(255,255,255,.64)' },
  detailValue: { fontFamily: FontFamily.bold, fontSize: 15, color: '#FFFFFF', marginTop: 2 },
  detailsButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16,
    paddingVertical: 9, borderRadius: 19, backgroundColor: 'rgba(20,30,20,.28)' },
  detailsButtonText: { fontFamily: FontFamily.bold, fontSize: 12, color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCompact: { flexWrap: 'nowrap' },
  cropCard: { justifyContent: 'space-between', padding: 13, borderRadius: 22, ...Shadows.button },
  cropCardRegular: { width: '48.4%', height: 125 },
  cropCardCompact: { flex: 1, height: 94, padding: 10, borderRadius: 18 },
  smallTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  moreCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' },
  cropName: { fontFamily: FontFamily.semibold, fontSize: 15, color: '#FFFFFF' },
  cropMeta: { fontFamily: FontFamily.semibold, fontSize: 12, color: 'rgba(255,255,255,.68)', marginTop: 2 },
  compactText: { fontSize: 10 },
  pressed: { opacity: .82, transform: [{ scale: .985 }] },
});
