import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import i18n from '../../src/i18n';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, setLanguage, subscriptionStatus } = useStore();

  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const formatTrialTime = () => {
    if (!subscriptionStatus?.trial_remaining_seconds) return '0h 0m';
    const hours = Math.floor(subscriptionStatus.trial_remaining_seconds / 3600);
    const minutes = Math.floor((subscriptionStatus.trial_remaining_seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Language Section */}
      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.optionRow,
            language === 'es' && styles.optionSelected
          ]}
          onPress={() => handleLanguageChange('es')}
        >
          <Text style={styles.optionText}>🇪🇸 {t('spanish')}</Text>
          {language === 'es' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[
            styles.optionRow,
            language === 'en' && styles.optionSelected
          ]}
          onPress={() => handleLanguageChange('en')}
        >
          <Text style={styles.optionText}>🇬🇧 {t('english')}</Text>
          {language === 'en' && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Subscription Section */}
      <Text style={styles.sectionTitle}>{t('subscription')}</Text>
      <View style={styles.card}>
        {subscriptionStatus?.status === 'active' ? (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('subscriptionActive')}</Text>
              <Text style={styles.statusSubtitle}>{t('priceMonthly')}</Text>
            </View>
          </View>
        ) : subscriptionStatus?.status === 'trial' ? (
          <View>
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{t('trialRemaining')}</Text>
                <Text style={styles.trialTime}>{formatTrialTime()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('/subscription')}
            >
              <Text style={styles.subscribeButtonText}>{t('activateSubscription')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.statusRow}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{t('trialExpired')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('/subscription')}
            >
              <Text style={styles.subscribeButtonText}>{t('activateSubscription')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Cycle Tracking */}
      <Text style={styles.sectionTitle}>{t('cycleTracking')}</Text>
      <TouchableOpacity style={styles.card} onPress={() => Alert.alert('Coming soon')}>
        <View style={styles.optionRow}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <Text style={[styles.optionText, { marginLeft: spacing.md }]}>
            {t('cycleTracking')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </View>
      </TouchableOpacity>

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.appName}>Ágora Mujeres</Text>
        <Text style={styles.version}>v1.0.0</Text>
        <Text style={styles.tagline}>
          {t('language') === 'es' 
            ? 'Un refugio para ti' 
            : 'A refuge for you'
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trialTime: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  appName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
