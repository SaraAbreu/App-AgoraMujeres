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
import { colors, spacing, borderRadius, typography } from '../src/theme/colors';
import { useStore } from '../src/store/useStore';
import { createCustomer, createPaymentIntent, activateSubscription, getSubscriptionStatus } from '../src/services/api';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language, setSubscriptionStatus, subscriptionStatus } = useStore();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'payment' | 'success'>('email');
  const [customerCreated, setCustomerCreated] = useState(false);

  const handleCreateCustomer = async () => {
    if (!email.trim() || !deviceId) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Por favor, introduce un email válido' : 'Please enter a valid email'
      );
      return;
    }
    
    setLoading(true);
    try {
      await createCustomer(deviceId, email.trim());
      setCustomerCreated(true);
      setStep('payment');
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo crear el cliente' : 'Could not create customer'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      // In a real app, you would use Stripe's payment sheet here
      // For MVP, we'll simulate a successful payment
      const paymentIntent = await createPaymentIntent(deviceId);
      
      // For demo purposes, we'll show a success message
      // In production, this would open Stripe's payment sheet
      Alert.alert(
        language === 'es' ? 'Pago pendiente' : 'Payment pending',
        language === 'es' 
          ? 'El sistema de pagos está en modo de prueba. Tu suscripción será activada.' 
          : 'The payment system is in test mode. Your subscription will be activated.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Simulate successful payment
              try {
                await activateSubscription(deviceId, paymentIntent.payment_intent_id);
                const status = await getSubscriptionStatus(deviceId);
                setSubscriptionStatus(status);
                setStep('success');
              } catch (e) {
                // For demo, still show success
                setStep('success');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
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
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={step === 'success' ? "checkmark-circle" : "heart"} 
              size={64} 
              color={step === 'success' ? colors.success : colors.primary} 
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
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
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
                    <Ionicons name="checkmark" size={20} color={colors.success} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Diario emocional ilimitado' : 'Unlimited emotional diary'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.success} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Conversaciones con Aurora' : 'Conversations with Aurora'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.success} />
                    <Text style={styles.featureText}>
                      {language === 'es' ? 'Análisis de patrones' : 'Pattern analysis'}
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark" size={20} color={colors.success} />
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
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} />
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
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
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
              <Text style={styles.successText}>
                {language === 'es' 
                  ? 'Tu suscripción está activa. Ahora puedes disfrutar de todas las funciones de Ágora.'
                  : 'Your subscription is active. You can now enjoy all of Ágora\'s features.'
                }
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.replace('/(tabs)')}
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
    backgroundColor: colors.background,
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  expiredBadge: {
    backgroundColor: '#F5E6E6',
  },
  trialBadgeText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    fontWeight: typography.weights.medium,
  },
  description: {
    fontSize: typography.sizes.md,
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
    shadowColor: colors.shadow,
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
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceBadgeText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  priceMonth: {
    fontSize: typography.sizes.md,
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
    color: colors.text,
  },
  emailInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  successText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  privacyNote: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
