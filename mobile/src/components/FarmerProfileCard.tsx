import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  ViewStyle,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows } from '../constants/theme';
import { hapticLight, hapticSelection } from '../utils/haptics';

export interface FarmerProfileData {
  name: string;
  handle: string;
  avatarUrl: any;
  role: string;
  farmLocation: string;
  joinedDate: string;
  kisanId: string;
  totalAcreage: string;
  activeBatchesCount: number;
  marketRating: string;
}

export interface FarmerProfileCardProps {
  farmer?: Partial<FarmerProfileData>;
  onEditPress?: () => void;
  style?: ViewStyle;
}

const DEFAULT_FARMER: FarmerProfileData = {
  name: 'Ramesh Patel',
  handle: '@ramesh.patel',
  avatarUrl: require('../../assets/farmer_ramesh.png'),
  role: 'Lead Cultivator & Farm Manager at Annapurna Farms.',
  farmLocation: 'East Field, Nashik Zone',
  joinedDate: 'December 2023',
  kisanId: 'ANN-98234',
  totalAcreage: '12.5 Acres',
  activeBatchesCount: 4,
  marketRating: '4.9 ★',
};

export function FarmerProfileCard({
  farmer = DEFAULT_FARMER,
  onEditPress,
  style,
}: FarmerProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const data = { ...DEFAULT_FARMER, ...farmer };

  const handleToggle = () => {
    hapticLight();
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Trigger Row (Avatar + Name + Handle) */}
      <TouchableOpacity
        style={styles.triggerRow}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapSmall}>
          <Image source={typeof data.avatarUrl === 'string' ? { uri: data.avatarUrl } : data.avatarUrl} style={styles.avatarSmall} />
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.nameBlock}>
          <View style={styles.nameLine}>
            <Text style={styles.farmerNameText}>{data.name}</Text>
            <MaterialIcons name="verified" size={14} color="#145C2E" />
          </View>
          <Text style={styles.handleText}>{data.handle}</Text>
        </View>

        <MaterialIcons
          name={isOpen ? 'expand-less' : 'expand-more'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Expanded Hover/Touch Card Modal / Popover */}
      {isOpen && (
        <View style={styles.hoverCardContainer}>
          <View style={styles.hoverCardHeader}>
            <Image source={typeof data.avatarUrl === 'string' ? { uri: data.avatarUrl } : data.avatarUrl} style={styles.avatarLarge} />
            <View style={styles.hoverHeaderContent}>
              <View style={styles.nameLine}>
                <Text style={styles.hoverName}>{data.name}</Text>
                <MaterialIcons name="verified" size={16} color="#145C2E" />
              </View>
              <Text style={styles.hoverHandle}>{data.handle}</Text>
              <View style={styles.kisanIdBadge}>
                <Text style={styles.kisanIdText}>Kisan ID: {data.kisanId}</Text>
              </View>
            </View>
          </View>

          {/* Bio / Description */}
          <Text style={styles.bioText}>{data.role}</Text>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Land Holding</Text>
              <Text style={styles.statVal}>{data.totalAcreage}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>Active Batches</Text>
              <Text style={styles.statVal}>{data.activeBatchesCount}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statLabel}>APMC Rating</Text>
              <Text style={[styles.statVal, { color: '#145C2E' }]}>{data.marketRating}</Text>
            </View>
          </View>

          {/* Join Date Footer */}
          <View style={styles.joinedFooterRow}>
            <View style={styles.joinedCol}>
              <MaterialIcons name="event" size={14} color="#6B7280" />
              <Text style={styles.joinedText}>Joined {data.joinedDate}</Text>
            </View>
            {onEditPress && (
              <TouchableOpacity
                onPress={() => {
                  setIsOpen(false);
                  onEditPress();
                }}
                activeOpacity={0.7}
                style={styles.editBtnSmall}
              >
                <Text style={styles.editBtnSmallText}>Edit Info</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Shadows.card,
  },
  avatarWrapSmall: {
    position: 'relative',
    marginRight: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameBlock: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmerNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  handleText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  hoverCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.15)',
    marginTop: 8,
    ...Shadows.modal,
    gap: 12,
  },
  hoverCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  hoverHeaderContent: {
    flex: 1,
  },
  hoverName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  hoverHandle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  kisanIdBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  kisanIdText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#145C2E',
  },
  bioText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  statVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  joinedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  joinedCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  joinedText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  editBtnSmall: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editBtnSmallText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#145C2E',
  },
});
