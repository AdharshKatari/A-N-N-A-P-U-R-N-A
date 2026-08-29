import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import PestScreen from '../screens/PestScreen';
import ScanScreen from '../screens/ScanScreen';
import SmartMoveScreen from '../screens/SmartMoveScreen';
import MarketScreen from '../screens/MarketScreen';
import { hapticLight } from '../utils/haptics';
import { Colors, FontFamily, Shadows } from '../constants/theme';

const Tab = createBottomTabNavigator();
const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home', 'Pest & Soil': 'eco', Scan: 'qr-code-scanner',
  'Smart Move': 'local-shipping', Market: 'storefront',
};

function DockItem({ route, focused, label, onPress, onLongPress }: {
  route: string; focused: boolean; label: string; onPress: () => void; onLongPress: () => void;
}) {
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pressed = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(lift, { toValue: focused ? 1 : 0, tension: 260, friction: 18, useNativeDriver: true }).start();
  }, [focused, lift]);
  return (
    <Pressable accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label} testID={`tab-${route.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      onPress={onPress} onLongPress={onLongPress}
      onPressIn={() => Animated.spring(pressed, { toValue: 1, tension: 300, friction: 14, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(pressed, { toValue: 0, tension: 260, friction: 18, useNativeDriver: true }).start()}
      style={styles.item}>
      <Animated.View style={[styles.iconTile, focused && styles.iconTileActive, {
        transform: [
          { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
          { scale: Animated.add(lift, pressed).interpolate({
            inputRange: [0, 1, 2],
            outputRange: [1, 1.16, 1.28],
            extrapolate: 'clamp',
          }) },
        ],
      }]}>
        <MaterialIcons name={icons[route]} size={focused ? 23 : 22}
          color={focused ? Colors.textOnPrimary : Colors.textSecondary} />
      </Animated.View>
      <Animated.View style={[styles.labelPill, {
        opacity: lift,
        transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [3, -2] }) }],
      }]}>
        <Text numberOfLines={1} style={styles.labelActive}>{label}</Text>
      </Animated.View>
      <Animated.View style={[styles.dot, { opacity: lift }]} />
    </Pressable>
  );
}

function DockBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.safeDock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel
            : typeof options.title === 'string' ? options.title : route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              hapticLight();
              navigation.navigate(route.name, route.params);
            }
          };
          return <DockItem key={route.key} route={route.name} focused={focused} label={label}
            onPress={onPress} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} />;
        })}
      </View>
    </View>
  );
}

export default function BottomTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator initialRouteName="Home" tabBar={(props) => <DockBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tab_home', 'Home') }} />
      <Tab.Screen name="Pest & Soil" component={PestScreen} options={{ tabBarLabel: t('tab_crops', 'Pest & Soil') }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: t('tab_scan', 'Scan') }} />
      <Tab.Screen name="Smart Move" component={SmartMoveScreen} options={{ tabBarLabel: t('tab_smart_move', 'Smart Move') }} />
      <Tab.Screen name="Market" component={MarketScreen} options={{ tabBarLabel: t('tab_market', 'Market') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  safeDock: { backgroundColor: Colors.background, paddingHorizontal: 14, paddingTop: 8 },
  dock: { minHeight: 76, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 7, paddingTop: 12,
    borderWidth: 1, borderColor: Colors.divider, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.96)', ...Shadows.nav },
  item: { flex: 1, minWidth: 0, minHeight: 64, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  iconTile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
    backgroundColor: '#ECEDE8', borderWidth: 1, borderColor: '#E0E2DC' },
  iconTileActive: { backgroundColor: Colors.primaryDeep, ...Shadows.button },
  labelPill: { position: 'absolute', top: -17, paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8, backgroundColor: Colors.textPrimary },
  labelActive: { color: Colors.textOnPrimary, fontFamily: FontFamily.semibold, fontSize: 10, lineHeight: 14 },
  dot: { width: 4, height: 4, marginTop: 4, borderRadius: 2, backgroundColor: Colors.primaryDeep },
});
