/**
 * LoginScreen — Voice-guided login with farmer artwork hero
 * Flow after language selection:
 *   SplashScreen → LanguageScreen → LoginScreen → Main (or Register for new users)
 * 
 * Credentials for SIH Demo:
 *   Username: ramesh.patel | Password: kisan123
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import FloatingInput from '../components/FloatingInput';
import { useAuth } from '../context/AuthContext';
import { Shake, Checkmark } from '../components/Animations';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamily,
  Shadows,
} from '../constants/theme';
import {
  GlassCard,
  GlassButton,
  FadeIn,
  MotionTokens,
} from '../components/GlassPrimitives';
import { hapticMedium, hapticLight, hapticSuccess } from '../utils/haptics';
import { voiceAssistantService } from '../services/voiceAssistant';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername]         = useState('ramesh.patel');
  const [password, setPassword]         = useState('kisan123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  const isFormValid = username.trim().length >= 3 && password.length >= 6;
  const { login } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    // Slide-up entrance of the login card
    Animated.parallel([
      Animated.timing(cardFade,  { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();

    // Voice greeting after 600ms
    const greetTimer = setTimeout(() => {
      const greetMsg =
        language === 'te' ? 'నమస్కారం! అన్నపూర్ణలోకి స్వాగతం. మీ Kisan ID మరియు పాస్‌వర్డ్ నమోదు చేయండి.' :
        language === 'hi' ? 'नमस्ते! अन्नपूर्णा में आपका स्वागत है। अपना किसान ID और पासवर्ड डालें।' :
        language === 'mr' ? 'नमस्कार! अन्नपूर्णामध्ये स्वागत आहे. आपला Kisan ID आणि पासवर्ड टाका.' :
        'Welcome to Annapurna! Please enter your Kisan ID and password to continue.';
      voiceAssistantService.speak(greetMsg, language, undefined, undefined);
    }, 600);

    return () => clearTimeout(greetTimer);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFormValid || loading) return;
    hapticMedium();
    setLoading(true);
    setShowSuccess(false);

    try {
      await login(username.trim(), password);
      setShowSuccess(true);
      hapticSuccess();
      setTimeout(() => {
        navigation.replace('Main');
      }, 500);
    } catch (err: any) {
      const message = err.message || 'Please try again.';
      Alert.alert('Login Failed', message);
      setShakeTrigger((t) => t + 1);
    } finally {
      setLoading(false);
    }
  }, [username, password, isFormValid, loading, navigation, login]);

  const handleQuickDemo = async () => {
    hapticLight();
    setUsername('ramesh.patel');
    setPassword('kisan123');
    setLoading(true);
    try {
      await login('ramesh.patel', 'kisan123');
      navigation.replace('Main');
    } catch (e) {
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero artwork top half */}
      <View style={styles.heroSection}>
        <Image
          source={require('../../assets/splash_art.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Dark scrim */}
        <View style={styles.heroScrim} />

        {/* Logo text on hero */}
        <View style={styles.heroTextBox}>
          <Text style={styles.heroAppName}>Annapurna</Text>
          <Text style={styles.heroTagline}>Harvest Today, Prosper Tomorrow</Text>
        </View>

        {/* Farmer avatar bottom of hero */}
        <View style={styles.farmerAvatarCircle}>
          <Image
            source={require('../../assets/farmer_ramesh.png')}
            style={styles.farmerAvatarImg}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* White login card bottom half */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[styles.loginCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}
        >
          {/* Farmer name label */}
          <View style={styles.farmerNameRow}>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#145C2E" />
              <Text style={styles.verifiedText}>Verified Kisan</Text>
            </View>
            <Text style={styles.farmerName}>Kisan Ramesh Patel</Text>
            <Text style={styles.farmerLocation}>Nashik, Maharashtra</Text>
          </View>

          {/* Voice guide button */}
          <TouchableOpacity
            style={styles.voiceGuideBtn}
            onPress={() => {
              hapticLight();
              const msg =
                language === 'te' ? 'మీ Kisan ID ramesh.patel మరియు పాస్‌వర్డ్ kisan123 అని నమోదు చేయండి.' :
                language === 'hi' ? 'Kisan ID ramesh.patel और पासवर्ड kisan123 दर्ज करें।' :
                'Enter Kisan ID: ramesh.patel and Password: kisan123 to sign in.';
              voiceAssistantService.speak(msg, language, undefined, undefined);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="microphone" size={16} color="#145C2E" />
            <Text style={styles.voiceGuideBtnText}>🔊 Voice Guide (मार्गदर्शन / మార్గదర్శనం)</Text>
          </TouchableOpacity>

          <Shake isShaking={shakeTrigger % 2 === 1 && !loading}>
            <View style={styles.formSection}>
              {/* Username */}
              <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Kisan ID / Username"
                    placeholder="e.g. ramesh.patel"
                    value={username}
                    onChangeText={setUsername}
                    leftIcon={<MaterialIcons name="person" size={20} color={Colors.primaryDeep} />}
                  />
                </GlassCard>
              </FadeIn>

              {/* Password */}
              <FadeIn delay={150} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Password"
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    leftIcon={<MaterialIcons name="lock" size={20} color={Colors.primaryDeep} />}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={20}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                    }
                  />
                </GlassCard>
              </FadeIn>

              {/* Sign In Button */}
              <FadeIn delay={200} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  onPress={handleLogin}
                  disabled={loading || !isFormValid}
                  loading={loading}
                  haptic="medium"
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : showSuccess ? (
                    <Checkmark size={24} color="#FFFFFF" isVisible={true} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In to Annapurna</Text>
                  )}
                </GlassButton>
              </FadeIn>

              {/* 1-Tap SIH Demo */}
              <FadeIn delay={250} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <TouchableOpacity
                  style={styles.quickAccessBtn}
                  onPress={handleQuickDemo}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="bolt" size={18} color="#059669" />
                  <Text style={styles.quickAccessText}>⚡ 1-Tap Demo Login (Kisan Ramesh)</Text>
                </TouchableOpacity>
              </FadeIn>

              {/* Register link */}
              <FadeIn delay={300} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>New farmer? </Text>
                  <Text style={styles.registerLinkHighlight}>Register with Voice Guide →</Text>
                </TouchableOpacity>
              </FadeIn>

              {/* Credentials info card */}
              <View style={styles.credentialsCard}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#6B7280" />
                <Text style={styles.credentialsText}>
                  {'  '}SIH Demo: <Text style={{ fontFamily: FontFamily.bold, color: '#145C2E' }}>ramesh.patel</Text>{' '}
                  / <Text style={{ fontFamily: FontFamily.bold, color: '#145C2E' }}>kisan123</Text>
                </Text>
              </View>
            </View>
          </Shake>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A2E1A',
  },
  flex: {
    flex: 1,
  },
  heroSection: {
    width,
    height: height * 0.36,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width,
    height: height * 0.36,
    position: 'absolute',
  },
  heroScrim: {
    position: 'absolute',
    width,
    height: height * 0.36,
    backgroundColor: 'rgba(10,46,26,0.52)',
  },
  heroTextBox: {
    position: 'absolute',
    top: 28,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroAppName: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 4,
  },
  heroTagline: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  farmerAvatarCircle: {
    position: 'absolute',
    bottom: -38,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    ...Shadows.cardElevated,
  },
  farmerAvatarImg: {
    width: 80,
    height: 80,
  },
  loginCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginTop: -2,
  },
  farmerNameRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  verifiedText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#145C2E',
  },
  farmerName: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  farmerLocation: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  voiceGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  voiceGuideBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: '#145C2E',
  },
  formSection: {
    gap: 10,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
  },
  loginButton: {
    marginTop: 4,
    borderRadius: BorderRadius.xl,
  },
  loginButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  quickAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  quickAccessText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  registerLinkText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLinkHighlight: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
  credentialsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  credentialsText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
  },
});
