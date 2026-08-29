/**
 * LoginScreen — JWT authentication without reCAPTCHA.
 *
 * Flow: Enter credentials → POST /api/v5/auth/login
 * On success, stores token in AsyncStorage and navigates to Main.
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  AnimatedPressable,
  FadeIn,
  ScaleIn,
  useReducedMotion,
  MotionTokens,
} from '../components/GlassPrimitives';
import { hapticMedium, hapticLight } from '../utils/haptics';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('ramesh.patel');
  const [password, setPassword] = useState('kisan123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const isFormValid = username.trim().length >= 3 && password.length >= 6;
  const { login } = useAuth();

  const handleLogin = useCallback(async () => {
    if (!isFormValid || loading) return;
    hapticMedium();
    setLoading(true);
    setShowSuccess(false);

    try {
      await login(username.trim(), password);
      setShowSuccess(true);
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerSection}>
            <FadeIn delay={50} duration={MotionTokens.duration.standard} direction="down" reducedMotion={false}>
              <View style={styles.logoCircle}>
                {showSuccess ? (
                  <Checkmark size={36} color="#FFFFFF" isVisible={showSuccess} />
                ) : (
                  <MaterialIcons name="eco" size={36} color={Colors.primaryDeep} />
                )}
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to Annapurna Farmer Portal</Text>
            </FadeIn>
          </View>

          <Shake isShaking={shakeTrigger % 2 === 1 && !loading}>
            <View style={styles.formSection}>
              {/* Username Field */}
              <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Username / Kisan ID"
                    placeholder="e.g. ramesh.patel"
                    value={username}
                    onChangeText={setUsername}
                    leftIcon={<MaterialIcons name="person" size={20} color={Colors.primaryDeep} />}
                  />
                </GlassCard>
              </FadeIn>

              {/* Password Field */}
              <FadeIn delay={150} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Password"
                    placeholder="Enter password (min 6 chars)"
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

              {/* Login Button */}
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
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </GlassButton>
              </FadeIn>

              {/* Quick Guest / Demo Access Button */}
              <FadeIn delay={250} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <TouchableOpacity
                  style={styles.quickAccessBtn}
                  onPress={handleQuickDemo}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="flash-on" size={16} color="#145C2E" />
                  <Text style={styles.quickAccessText}>1-Tap Demo / Guest Login</Text>
                </TouchableOpacity>
              </FadeIn>

              {/* Register Link */}
              <FadeIn delay={300} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>Don't have an account? </Text>
                  <Text style={styles.registerLinkHighlight}>Create Profile</Text>
                </TouchableOpacity>
              </FadeIn>
            </View>
          </Shake>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primaryMuted,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formSection: {
    gap: 12,
  },
  formCard: {
    borderRadius: BorderRadius.xl,
  },
  loginButton: {
    marginTop: 8,
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
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(20, 92, 46, 0.15)',
  },
  quickAccessText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#145C2E',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
});
