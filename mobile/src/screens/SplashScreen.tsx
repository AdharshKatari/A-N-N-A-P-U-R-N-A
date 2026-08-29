import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

// Premium easing curves (Emil Kowalski style)
const easeOut = { tension: 80, friction: 12 };

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(12)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance — logo → title → subtitle, each with spring physics
    Animated.sequence([
      // Logo entrance with spring
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          ...easeOut,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Ring pulse effect
      Animated.parallel([
        Animated.spring(ringScale, {
          toValue: 1.3,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Title entrance (staggered after logo)
    Animated.parallel([
      Animated.spring(titleFade, {
        toValue: 1,
        delay: 200,
        ...easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(titleSlide, {
        toValue: 0,
        delay: 200,
        ...easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtitle entrance (staggered after title)
    Animated.parallel([
      Animated.spring(subtitleFade, {
        toValue: 1,
        delay: 400,
        ...easeOut,
        useNativeDriver: true,
      }),
      Animated.spring(subtitleSlide, {
        toValue: 0,
        delay: 400,
        ...easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow on logo
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // Navigate to Onboarding after entrance animations complete
    const timer = setTimeout(() => {
      // Animate exit: logo scales up and fades out, then navigate
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(titleFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('Onboarding');
      });
    }, 2500);
    return () => {
      clearTimeout(timer);
      glowLoop.stop();
    };
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Logo with ring pulse */}
      <View style={styles.logoWrapper}>
        <Animated.View
          style={[
            styles.logoRing,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.logoCircle,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.glowOverlay, { opacity: glowOpacity }]} />
          <Text style={styles.logoIcon}>🌾</Text>
        </Animated.View>
      </View>

      {/* Title — staggered entrance */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleFade,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        Annapurna
      </Animated.Text>

      {/* Subtitle — staggered entrance */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleFade,
            transform: [{ translateY: subtitleSlide }],
          },
        ]}
      >
        Harvest Today, Prosper Tomorrow
      </Animated.Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>AI for a Better Harvest</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoIcon: {
    fontSize: 56,
  },
  title: {
    ...Typography.display,
    color: Colors.textOnPrimary,
    fontSize: 36,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});
