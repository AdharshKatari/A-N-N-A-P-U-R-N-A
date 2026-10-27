import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  batchId: string;
  cropType?: string;
  weightKg: number;
  visualScore: number;
  gradeTier: string;
  qrToken?: string;
  shelfLifeDays?: number;
}

export function QualityPassportModal(props: Props) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.title}>Quality passport</Text>
            <Text style={styles.row}>Batch: {props.batchId}</Text>
            <Text style={styles.row}>Crop: {props.cropType || 'Unspecified'}</Text>
            <Text style={styles.row}>Weight: {props.weightKg} kg</Text>
            <Text style={styles.row}>Visual score: {props.visualScore}/100</Text>
            <Text style={styles.row}>Grade: {props.gradeTier}</Text>
            {props.shelfLifeDays !== undefined && <Text style={styles.row}>Shelf life: {props.shelfLifeDays} days</Text>}
            <Text style={styles.row}>Verification token</Text>
            <Text selectable style={styles.token}>{props.qrToken || 'No verification token recorded'}</Text>
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={props.onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#00431D', marginBottom: 20 },
  row: { fontSize: 16, color: '#25352A', marginBottom: 12 },
  token: { fontSize: 13, color: '#526458', marginBottom: 20 },
  close: { backgroundColor: '#145C2E', borderRadius: 14, padding: 14, alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
