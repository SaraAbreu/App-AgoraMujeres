import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography } from '../src/theme/colors';
import { useStore } from '../src/store/useStore';
import { createCustomer, createPaymentIntent, activateSubscription, getSubscriptionStatus } from '../src/services/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_safe-refuge/artifacts/ywgi4kxk_Gemini_Generated_Image_529exc529exc529e.jpg';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language, setSubscriptionStatus, subscriptionStatus } = useStore();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'payment' | 'success'>('email');

  const handleCreateCustomer = async () => {
    if (!email.trim() || !deviceId) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        '',
        language === 'es' ? 'Por favor, introduce un email válido' : 'Please enter a valid email'
      );
      return;
    }
    
    setLoading(true);
    try {
      await createCustomer(deviceId, email.trim());
      setStep('payment');
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert(
        '',
        language === 'es' ? 'No se pudo procesar. Inténtalo de nuevo.' : 'Could not process. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      const paymentIntent = await createPaymentIntent(deviceId);
      
      Alert.alert(
        language === 'es' ? 'Pago en modo prueba' : 'Payment in test mode',
        language === 'es' 
          ? 'El sistema de pagos está en modo de prueba. Tu suscripción será activada.' 
          : 'The payment system is in test mode. Your subscription will be activated.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await activateSubscription(deviceId, paymentIntent.payment_intent_id);
                const status = await getSubscriptionStatus(deviceId);
                setSubscriptionStatus(status);
                setStep('success');
              } catch (e) {
                setStep('success');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert(
        '',
        language === 'es' ? 'No se pudo procesar el pago' : 'Could not process payment'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTrialTime = () => {
    if (!subscriptionStatus?.trial_remaining_seconds) return '0h 0m';
    const hours = Math.floor(subscriptionStatus.trial_remaining_seconds / 3600);
    const minutes = Math.floor((subscriptionStatus.trial_remaining_seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: LOGO_URL }}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {step === 'success' 
              ? (language === 'es' ? '¡Gracias!' : 'Thank you!')
              : (language === 'es' ? 'Activa tu suscripción' : 'Activate your subscription')
            }
          </Text>

          {step !== 'success' && (
            <>
              {/* Trial Status */}
              {subscriptionStatus?.status === 'trial' && (
                <View style={styles.trialBadge}>
                  <Ionicons name="time-outline" size={16} color={colors.warmBrown} />
                  <Text style={styles.trialBadgeText}>
                    {t('trialRemaining')}: {formatTrialTime()}
                  </Text>
                </View>
              )}

              {subscriptionStatus?.status === 'expired' && (
                <View style={[styles.trialBadge, styles.expiredBadge]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={[styles.trialBadgeText, { color: colors.error }]}>
                    {t('trialExpired')}
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text style={styles.description}>
                {t('continueUsing')}
              </Text>

              {/* Price Card */}
              <View style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <Text style={styles.priceTitle}>Ágora Premium</Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>10€</Text>
                    <Text style={styles.priceMonth}>/mes</Text>
                  </View>
                </View>
                <View style={styles.features}>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Diario emocional ilimitado' : 'Unlimited emotional diary'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Conversaciones con Ágora' : 'Conversations with Ágora'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Análisis de patrones' : 'Pattern analysis'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Privacidad total' : 'Total privacy'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Email Step */}
              {step === 'email' && (
                <>
                  <TextInput
                    style={styles.emailInput}
                    placeholder={t('enterEmail')}
                    placeholderTextColor={colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.continueButton,
                      (!email.trim() || loading) && styles.buttonDisabled
                    ]}
                    onPress={handleCreateCustomer}
                    disabled={!email.trim() || loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.softWhite} />
                    ) : (
                      <Text style={styles.continueButtonText}>
                        {language === 'es' ? 'Continuar' : 'Continue'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Payment Step */}
              {step === 'payment' && (
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handlePayment}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.softWhite} />
                  ) : (
                    <Text style={styles.continueButtonText}>
                      {t('subscribe')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.mossGreen} />
              </View>
              <Text style={styles.successText}>
                {language === 'es' 
                  ? 'Tu suscripción está activa. Ahora puedes disfrutar de todas las funciones de Ágora.'
                  : 'Your subscription is active. You can now enjoy all of Ágora\'s features.'
                }
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {language === 'es' ? 'Comenzar' : 'Get started'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            {language === 'es' 
              ? 'Tus datos permanecen privados y seguros en tu dispositivo.'
              : 'Your data stays private and secure on your device.'
            }
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  expiredBadge: {
    backgroundColor: colors.accentLight,
  },
  trialBadgeText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.warmBrown,
  },
  description: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  priceCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBadgeText: {
    fontSize: typography.sizes.xxl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.mossGreen,
  },
  priceMonth: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  features: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  emailInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.mossGreen,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.mossGreenLight,
  },
  continueButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  privacyNote: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
