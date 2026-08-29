import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Spacing } from '../constants/theme';

export default function NotificationDetailScreen({ navigation, route }: any) {
  const item = route?.params?.item;
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" testID="notification-detail-back"
          onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.primaryDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Details</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <MaterialIcons name={(item?.icon || 'notifications') as any} size={40} color={Colors.primaryDeep} />
        <Text style={styles.title}>{item?.title || 'Notification'}</Text>
        <Text style={styles.description}>{item?.description || 'No additional details are available.'}</Text>
        {!!item?.time_label && <Text style={styles.time}>{item.time_label}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.textPrimary },
  content: { padding: Spacing.xl, gap: Spacing.md },
  title: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.textPrimary },
  description: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24, color: Colors.textSecondary },
  time: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.textMuted },
});
