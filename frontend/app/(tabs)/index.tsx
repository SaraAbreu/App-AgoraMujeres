import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getSubscriptionStatus, getWeather } from '../../src/services/api';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, subscriptionStatus, setSubscriptionStatus } = useStore();
  const [weather, setWeather] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!deviceId) return;
    
    try {
      // Load subscription status
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status);
      
      // Try to get weather
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const weatherData = await getWeather(location.coords.latitude, location.coords.longitude);
          setWeather(weatherData);
        }
      } catch (e) {
        console.log('Weather not available');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatTrialTime = () => {
    if (!subscriptionStatus?.trial_remaining_seconds) return null;
    const hours = Math.floor(subscriptionStatus.trial_remaining_seconds / 3600);
    const minutes = Math.floor((subscriptionStatus.trial_remaining_seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getWeatherIcon = (condition: string) => {
    const icons: Record<string, string> = {
      clear: 'sunny-outline',
      mainly_clear: 'sunny-outline',
      partly_cloudy: 'partly-sunny-outline',
      overcast: 'cloudy-outline',
      fog: 'cloudy-outline',
      drizzle: 'rainy-outline',
      rain: 'rainy-outline',
      snow: 'snow-outline',
      showers: 'rainy-outline',
      thunderstorm: 'thunderstorm-outline',
    };
    return icons[condition] || 'partly-sunny-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        {/* Trial Banner */}
        {subscriptionStatus?.status === 'trial' && (
          <TouchableOpacity 
            style={styles.trialBanner}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.trialContent}>
              <Ionicons name="time-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.trialText}>
                {t('trialRemaining')}: {formatTrialTime()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
          </TouchableOpacity>
        )}

        {subscriptionStatus?.status === 'expired' && (
          <TouchableOpacity 
            style={[styles.trialBanner, styles.expiredBanner]}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.trialContent}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.trialText, { color: colors.error }]}>
                {t('trialExpired')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error} />
          </TouchableOpacity>
        )}

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <Ionicons 
              name={getWeatherIcon(weather.condition) as any} 
              size={32} 
              color={colors.warmAccent} 
            />
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.weatherDetail}>
                {t('humidity')}: {weather.humidity}% • {t('pressure')}: {Math.round(weather.pressure)} hPa
              </Text>
            </View>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t('welcomeBack')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('howAreYou')}</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/diary/new')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="create-outline" size={28} color={colors.white} />
            </View>
            <Text style={styles.actionTitle}>{t('writeEntry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warmAccent }]}>
              <Ionicons name="leaf-outline" size={28} color={colors.white} />
            </View>
            <Text style={styles.actionTitle}>{t('talkToAgora')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/patterns')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="analytics-outline" size={28} color={colors.white} />
            </View>
            <Text style={styles.actionTitle}>{t('viewPatterns')}</Text>
          </TouchableOpacity>
        </View>

        {/* Gentle Reminder */}
        <View style={styles.reminderCard}>
          <Ionicons name="leaf" size={24} color={colors.secondary} />
          <Text style={styles.reminderText}>
            {t('language') === 'es' 
              ? 'Cada día cuenta, incluso los más difíciles. Estás haciendo un trabajo increíble.'
              : 'Every day counts, even the hardest ones. You are doing an amazing job.'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.sizes.xxl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.primaryDark,
  },
  tagline: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  expiredBanner: {
    backgroundColor: colors.accentLight,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trialText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.primaryDark,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
  },
  weatherDetail: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  welcomeCard: {
    backgroundColor: colors.warmAccentLight,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    textAlign: 'center',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondaryLight,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  reminderText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
