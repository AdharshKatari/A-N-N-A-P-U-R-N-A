import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Dimensions, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const overlayFade   = useRef(new Animated.Value(0)).current;
  const titleFade     = useRef(new Animated.Value(0)).current;
  const titleSlide    = useRef(new Animated.Value(20)).current;
  const subtitleFade  = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(10)).current;
  const footerFade    = useRef(new Animated.Value(0)).current;
  const exitFade      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.timing(overlayFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.parallel([
      Animated.timing(subtitleFade,  { toValue: 1, duration: 500, delay: 700, useNativeDriver: true }),
      Animated.timing(subtitleSlide, { toValue: 0, duration: 500, delay: 700, useNativeDriver: true }),
    ]).start();

    Animated.timing(footerFade, { toValue: 1, duration: 500, delay: 1000, useNativeDriver: true }).start();

    // Navigate after 2.8 seconds
    const timer = setTimeout(async () => {
      let nextScreen = 'Language';
      try {
        const languageDone = await AsyncStorage.getItem('@language_onboarding_completed');
        const loggedIn     = await AsyncStorage.getItem('@auth_token');
        if (languageDone === 'true' && loggedIn) {
          nextScreen = 'Main';
        } else if (languageDone === 'true') {
          nextScreen = 'Login';
        }
      } catch (e) {}

      Animated.timing(exitFade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        navigation.replace(nextScreen);
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitFade }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed splash artwork */}
      <Image
        source={require('../../assets/splash_art.png')}
        style={styles.artImage}
        resizeMode="cover"
      />

      {/* Semi-transparent dark gradient so text pops */}
      <Animated.View style={[styles.gradientOverlay, { opacity: overlayFade }]} />

      {/* App name + tagline in upper region */}
      <View style={styles.topContent}>
        <Animated.Text
          style={[styles.appName, { opacity: titleFade, transform: [{ translateY: titleSlide }] }]}
        >
          Annapurna
        </Animated.Text>
        <Animated.Text
          style={[styles.tagline, { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] }]}
        >
          Harvest Today, Prosper Tomorrow
        </Animated.Text>
      </View>

      {/* Bottom footer pill */}
      <Animated.View style={[styles.footer, { opacity: footerFade }]}>
        <Text style={styles.footerText}>AI for a Better Harvest</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2E1A',
  },
  artImage: {
    position: 'absolute',
    width,
    height,
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    width,
    height,
    backgroundColor: 'rgba(10,46,26,0.40)',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: height * 0.08,
    paddingHorizontal: 24,
  },
  appName: {
    fontFamily: FontFamily.bold,
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: 17,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 22,
  },
  footerText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
  },
});
