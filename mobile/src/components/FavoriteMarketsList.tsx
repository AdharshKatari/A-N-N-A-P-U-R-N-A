import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

export interface FavoriteMarket {
  id: string;
  market: string;
  state: string;
  price: number;
  distance?: number;
  isRecommended?: boolean;
}

const STORAGE_KEY = 'annapurna.favoriteMarkets';

export default function FavoriteMarketsList({
  markets, onMarketPress,
}: { markets: FavoriteMarket[]; onMarketPress: (market: FavoriteMarket) => void }) {
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setPinned(new Set(JSON.parse(saved)));
    }).catch(() => undefined);
  }, []);
  const toggle = (id: string) => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPinned((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => undefined);
      return next;
    });
  };
  const favorites = markets.filter((market) => pinned.has(market.id));
  const nearby = markets.filter((market) => !pinned.has(market.id));
  return (
    <View style={styles.root}>
      {favorites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAVORITE MARKETS</Text>
          {favorites.map((market) => <MarketRow key={market.id} market={market} pinned
            onToggle={toggle} onPress={onMarketPress} />)}
        </View>
      )}
      <View style={styles.section}>
        <View style={styles.headingRow}>
          <Text style={styles.sectionTitle}>NEARBY MARKETS</Text>
          <Text style={styles.count}>{nearby.length}</Text>
        </View>
        {nearby.map((market) => <MarketRow key={market.id} market={market}
          pinned={false} onToggle={toggle} onPress={onMarketPress} />)}
      </View>
    </View>
  );
}

function MarketRow({ market, pinned, onToggle, onPress }: {
  market: FavoriteMarket;
  pinned: boolean;
  onToggle: (id: string) => void;
  onPress: (market: FavoriteMarket) => void;
}) {
  return (
    <Pressable onPress={() => onPress(market)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <MaterialIcons name={market.isRecommended ? 'verified' : 'storefront'} size={21}
          color={market.isRecommended ? Colors.primaryDeep : Colors.textMuted} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>{market.market}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {market.state} · {market.distance != null ? `${market.distance} km away` : 'Distance pending'}
        </Text>
        <Text style={styles.price}>₹{market.price.toLocaleString('en-IN')}/q</Text>
      </View>
      <Pressable accessibilityRole="button"
        accessibilityLabel={pinned ? `Remove ${market.market} from favorites` : `Add ${market.market} to favorites`}
        onPress={(event) => { event.stopPropagation(); onToggle(market.id); }}
        style={[styles.pinButton, pinned && styles.pinButtonActive]}>
        <MaterialIcons name="push-pin" size={17} color={pinned ? Colors.textOnPrimary : Colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 20 },
  section: { gap: 9 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: 11, letterSpacing: 1, color: Colors.textMuted },
  count: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.textOnPrimary, backgroundColor: Colors.successBg,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surfaceAlt, ...Shadows.button },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  copy: { flex: 1 },
  name: { fontFamily: FontFamily.bold, fontSize: 14, color: Colors.textPrimary },
  meta: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  price: { fontFamily: FontFamily.semibold, fontSize: 12, color: Colors.primaryDeep, marginTop: 2 },
  pinButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.divider },
  pinButtonActive: { backgroundColor: Colors.primaryDeep },
  pressed: { opacity: .76, transform: [{ scale: .99 }] },
});
