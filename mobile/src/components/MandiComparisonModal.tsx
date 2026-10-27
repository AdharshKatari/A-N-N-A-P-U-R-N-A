import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { compareMandis } from '../services/api';

interface Props { visible: boolean; onClose: () => void; cropName: string; quantityKg: number }

export function MandiComparisonModal({ visible, onClose, cropName, quantityKg }: Props) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof compareMandis>> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setResult(null);
    setError(false);
    compareMandis(cropName, 'Nashik', 'Vashi Mumbai', quantityKg)
      .then(data => { if (active) setResult(data); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [visible, cropName, quantityKg]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24 }}>
          <ScrollView>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#00431D', marginBottom: 20 }}>Compare markets</Text>
            <Text>{cropName} · {quantityKg} kg</Text>
            {!result && !error && <ActivityIndicator accessibilityLabel="Loading comparison" />}
            {error && <Text>Comparison unavailable. Please try again.</Text>}
            {result && <>
              <Text style={{ marginVertical: 12 }}>Estimated comparison including transport and spoilage</Text>
              {[result.mandi_a, result.mandi_b].map(market => (
                <View key={market.mandi_name} style={{ paddingVertical: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 18 }}>{market.mandi_name}</Text>
                  <Text>Price: ₹{market.modal_price_per_kg}/kg</Text>
                  <Text>Net proceeds with pooled freight: ₹{market.net_profit_fpo_inr.toLocaleString('en-IN')}</Text>
                  <Text>Distance: {market.distance_km} km</Text>
                </View>
              ))}
            </>}
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={onClose} style={{ marginTop: 20, backgroundColor: '#145C2E', borderRadius: 14, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
