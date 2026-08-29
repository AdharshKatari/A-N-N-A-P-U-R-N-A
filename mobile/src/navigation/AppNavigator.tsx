/**
 * AppNavigator — Premium Transition System
 * 
 * Each screen type gets a transition that matches its role in the user journey:
 * 
 * Splash → Onboarding:    zoom (400ms) — splash expands into onboarding
 * Onboarding → Language:  zoom_slide (350ms) — forward momentum, entering the app
 * Language → Main:        zoom (400ms) — settings reveal the dashboard
 * Detail screens:         slide_from_right (300ms) — standard push
 * Modals:                 slide_from_bottom (350ms) — iOS modal feel
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LanguageScreen from '../screens/LanguageScreen';
import BottomTabs from './BottomTabs';
import ProfileScreen from '../screens/ProfileScreen';

import SpoilageScreen from '../screens/SpoilageScreen';
import WhatIfScreen from '../screens/WhatIfScreen';
import RecommendationScreen from '../screens/RecommendationScreen';
import WeatherScreen from '../screens/WeatherScreen';
import NotificationScreen from '../screens/NotificationScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';

import CropDetailsScreen from '../screens/CropDetailsScreen';
import CropBatchesScreen from '../screens/CropBatchesScreen';
import AddCropScreen from '../screens/AddCropScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import RouteScreen from '../screens/RouteScreen';
import ScanScreen from '../screens/ScanScreen';
import SmartMoveScreen from '../screens/SmartMoveScreen';
import MarketScreen from '../screens/MarketScreen';
import DrawAOIScreen from '../screens/DrawAOIScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';

import { GlassMotion } from '../components/GlassPrimitives';

const Stack = createNativeStackNavigator();

// ============================================================================
// Premium transition configs — aligned with GlassMotion tokens
// ============================================================================

const transitions = {
  // --- Onboarding Journey (dramatic reveals) ---
  /** Splash → Onboarding: clean crossfade from dark to light */
  splashToOnboarding: {
    animation: 'fade' as const,
    animationDuration: GlassMotion.duration.standard,
  },
  /** Onboarding → Language: slide up into app setup */
  onboardingToLanguage: {
    animation: 'slide_from_bottom' as const,
    animationDuration: GlassMotion.duration.moderate,
  },
  /** Language → Main: dashboard reveals from below */
  languageToMain: {
    animation: 'fade_from_bottom' as const,
    animationDuration: GlassMotion.duration.slow,
  },

  // --- Standard Navigation ---
  /** Default push: slide from right */
  slideFromRight: {
    animation: 'slide_from_right' as const,
    animationDuration: GlassMotion.duration.standard,
  },
  /** Slide from left (back navigation feel) */
  slideFromLeft: {
    animation: 'slide_from_left' as const,
    animationDuration: GlassMotion.duration.standard,
  },
  /** Fade for subtle transitions */
  fade: {
    animation: 'fade' as const,
    animationDuration: GlassMotion.duration.fast,
  },

  // --- Modals ---
  /** iOS-style modal: slide from bottom */
  modal: {
    animation: 'slide_from_bottom' as const,
    animationDuration: GlassMotion.duration.slow,
  },
  /** Modal with fade (for lighter modals) */
  modalFade: {
    animation: 'fade_from_bottom' as const,
    animationDuration: GlassMotion.duration.moderate,
  },
};

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        // Default transition for all screens
        animation: 'slide_from_right',
        animationDuration: GlassMotion.duration.standard,
        // Enable gesture-based back navigation
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* ==================================================================
       * ONBOARDING JOURNEY — Premium reveal transitions
       * ================================================================== */}

      {/* Screen 1: Splash — dark green, logo entrance */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{
          ...transitions.fade,
          gestureEnabled: false,
          animationDuration: GlassMotion.duration.fast,
        }}
      />

      {/* Screen 2: Onboarding — visual product demonstrations */}
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          ...transitions.splashToOnboarding,
          gestureEnabled: false,
        }}
      />

      {/* Screen 3: Language/Settings — setup before main app */}
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{
          ...transitions.onboardingToLanguage,
          gestureEnabled: false,
        }}
      />

      {/* ==================================================================
       * MAIN APP — Dashboard reveal
       * ================================================================== */}

      {/* Main dashboard — the big reveal after onboarding */}
      <Stack.Screen
        name="Main"
        component={BottomTabs}
        options={{
          ...transitions.languageToMain,
          gestureEnabled: false,
        }}
      />

      {/* ==================================================================
       * DETAIL SCREENS — Standard push navigation
       * ================================================================== */}

      <Stack.Screen
        name="Spoilage"
        component={SpoilageScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="WhatIf"
        component={WhatIfScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Recommendation"
        component={RecommendationScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Weather"
        component={WeatherScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="CropDetails"
        component={CropDetailsScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="CropBatches"
        component={CropBatchesScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Route"
        component={RouteScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="SmartMove"
        component={SmartMoveScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Market"
        component={MarketScreen}
        options={transitions.slideFromRight}
      />

      {/* ==================================================================
       * MODALS — iOS-style slide from bottom
       * ================================================================== */}

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          ...transitions.modal,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{
          ...transitions.modal,
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={transitions.slideFromRight} />
      <Stack.Screen
        name="AddCrop"
        component={AddCropScreen}
        options={{
          ...transitions.modal,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="DrawAOI"
        component={DrawAOIScreen}
        options={{
          ...transitions.modal,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          ...transitions.slideFromRight,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          ...transitions.slideFromRight,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="ContactSupport"
        component={HelpCenterScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="SupportChat"
        component={HelpCenterScreen}
        options={transitions.slideFromRight}
      />
      <Stack.Screen
        name="Settings"
        component={LanguageScreen}
        options={transitions.slideFromRight}
      />
    </Stack.Navigator>
  );
}
