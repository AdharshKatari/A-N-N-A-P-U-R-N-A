/**
 * RegisterScreen — Create new account without reCAPTCHA.
 *
 * Flow: Enter credentials → POST /api/v5/auth/register
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FloatingInput from '../components/FloatingInput';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, FontFamily, Shadows } from '../constants/theme';
import { Shake, Checkmark, Confetti } from '../components/Animations';
import {
  GlassCard,
  GlassButton,
  AnimatedPressable,
  FadeIn,
  useReducedMotion,
  MotionTokens,
} from '../components/GlassPrimitives';
import { hapticMedium, hapticLight } from '../utils/haptics';

export default function RegisterScreen({ navigation, route }: any) {
  const returnTo = route?.params?.returnTo;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const isFormValid =
    username.trim().length >= 3 &&
    password.length >= 6 &&
    password === confirmPassword;

  const { register } = useAuth();

  const handleRegister = useCallback(async () => {
    if (!isFormValid || loading) return;

    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", 'Please make sure both passwords are identical.');
      setShakeTrigger((t) => t + 1);
      return;
    }

    hapticMedium();
    setLoading(true);
    setShowSuccess(false);
    setShowConfetti(false);

    try {
      await register(username.trim(), password);

      setShowSuccess(true);
      setShowConfetti(true);
      setTimeout(() => {
        if (returnTo === 'Analysis') navigation.popTo('Analysis', undefined, { merge: true });
        else navigation.replace('Main');
      }, 700);
    } catch (err: any) {
      const message = err.message || 'Please try again.';
      Alert.alert('Registration Failed', message);
      setShakeTrigger((t) => t + 1);
    } finally {
      setLoading(false);
    }
  }, [username, password, confirmPassword, isFormValid, loading, navigation, register, returnTo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <FadeIn delay={50} duration={MotionTokens.duration.standard} direction="down" reducedMotion={false}>
              <View style={styles.logoCircle}>
                {showSuccess ? (
                  <Checkmark size={36} color="#FFFFFF" isVisible={showSuccess} />
                ) : (
                  <MaterialIcons name="person-add" size={32} color={Colors.primaryDeep} />
                )}
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Annapurna Farmer Community</Text>
            </FadeIn>
          </View>

          <Shake isShaking={shakeTrigger % 2 === 1 && !loading}>
            <View style={styles.formSection}>
              {/* Username Field */}
              <FadeIn delay={100} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Username"
                    placeholder="Choose a username (min 3 chars)"
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
                    placeholder="Choose password (min 6 chars)"
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

              {/* Confirm Password Field */}
              <FadeIn delay={200} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassCard level="level1" style={styles.formCard}>
                  <FloatingInput
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    leftIcon={<MaterialIcons name="lock-outline" size={20} color={Colors.primaryDeep} />}
                  />
                </GlassCard>
              </FadeIn>

              {/* Register Button */}
              <FadeIn delay={250} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  onPress={handleRegister}
                  disabled={loading || !isFormValid}
                  loading={loading}
                  haptic="medium"
                  style={styles.registerButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Register & Enter</Text>
                  )}
                </GlassButton>
              </FadeIn>

              {/* Login Link */}
              <FadeIn delay={300} duration={MotionTokens.duration.standard} direction="up" reducedMotion={false}>
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => navigation.navigate('Login', { returnTo })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLinkText}>Already have an account? </Text>
                  <Text style={styles.loginLinkHighlight}>Sign in</Text>
                </TouchableOpacity>
              </FadeIn>
            </View>
          </Shake>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
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
  registerButton: {
    marginTop: 8,
    borderRadius: BorderRadius.xl,
  },
  registerButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnPrimary,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginLinkText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkHighlight: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
});
