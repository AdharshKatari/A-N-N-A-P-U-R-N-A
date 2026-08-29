import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getNotifications, markNotificationAsRead } from '../services/api';

export default function NotificationScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.notifications || []);
        setNotifications(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
        setLoading(false);
      });
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    try {
      await markNotificationAsRead();
    } catch (e) {
      console.warn('Failed to sync mark all read:', e);
    }
  };

  const handleOpenNotification = async (item: any) => {
    if (item.unread) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
      try {
        await markNotificationAsRead(item.id);
      } catch (e) {}
    }
    navigation.navigate('NotificationDetail', { id: item.id, item });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF9F0" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="notifications-back"
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#00431D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mark all notifications as read"
          testID="notifications-mark-all-read" activeOpacity={0.7} onPress={handleMarkAllRead}> 
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#145C2E" style={{ marginTop: 20 }} />
        ) : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <MaterialIcons name="notifications-none" size={48} color="#707A6F" />
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', color: '#707A6F', marginTop: 10 }}>No new notifications</Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open notification: ${item.title}`}
                testID={`notification-${item.id}`}
                style={[
                  styles.notifCard,
                  item.unread && styles.notifCardUnread,
                ]}
                activeOpacity={0.85}
                onPress={() => handleOpenNotification(item)}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.icon_bg || '#E8F5E9' }]}>
                  <MaterialIcons name={(item.icon || 'notifications') as any} size={22} color={item.icon_color || '#145C2E'} />
                </View>

                <View style={styles.textCol}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {item.unread && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifDesc}>{item.description}</Text>
                  <Text style={styles.notifTime}>{item.time_label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF9F0',
  },
  header: {
    backgroundColor: '#FEF9F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    color: '#00431D',
  },
  markAllReadText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#145C2E',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  notifList: {
    gap: 12,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#145C2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 217, 0.6)',
  },
  notifCardUnread: {
    borderColor: '#90D79C',
    backgroundColor: '#FAF7F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1D1C16',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#145C2E',
  },
  notifDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#404940',
  },
  notifTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#707A6F',
    marginTop: 2,
  },
});
