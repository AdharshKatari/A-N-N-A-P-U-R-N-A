import React from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import HomeScreen from '../screens/HomeScreen';
import PestScreen from '../screens/PestScreen';
import VaaniScreen from '../screens/VaaniScreen';
import SmartMoveScreen from '../screens/SmartMoveScreen';
import MarketScreen from '../screens/MarketScreen';
import { hapticLight } from '../utils/haptics';
import { Colors, FontFamily, Shadows } from '../constants/theme';

const Tab = createBottomTabNavigator();
const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  'Smart Move': 'local-shipping',
  Vaani: 'record-voice-over',
  'Pest & Soil': 'eco',
  Market: 'storefront',
};

function DockItem({
  route,
  focused,
  label,
  onPress,
  onLongPress,
}: {
  route: string;
  focused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={label}
      testID={`tab-${route.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <View style={[styles.iconTile, focused && styles.iconTileActive]}>
        <MaterialIcons
          name={icons[route] || 'circle'}
          size={22}
          color={focused ? '#FFFFFF' : Colors.textSecondary}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DockBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.safeDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              hapticLight();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <DockItem
              key={route.key}
              route={route.name}
              focused={focused}
              label={label}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <DockBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tab_home', 'Home') }}
      />
      <Tab.Screen
        name="Smart Move"
        component={SmartMoveScreen}
        options={{ tabBarLabel: t('tab_smart_move', 'Smart Move') }}
      />
      <Tab.Screen
        name="Vaani"
        component={VaaniScreen}
        options={{ tabBarLabel: t('tab_voice', 'Vaani AI') }}
      />
      <Tab.Screen
        name="Pest & Soil"
        component={PestScreen}
        options={{ tabBarLabel: t('tab_crops', 'Pest & Soil') }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{ tabBarLabel: t('tab_market', 'Market') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  safeDock: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  dock: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.12)',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    ...Shadows.glass1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconTile: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#F3F4F1',
  },
  iconTileActive: {
    backgroundColor: Colors.primaryDeep,
    ...Shadows.button,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.primaryDeep,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
});
