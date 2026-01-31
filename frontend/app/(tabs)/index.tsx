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
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getSubscriptionStatus, getWeather } from '../../src/services/api';
import * as Location from 'expo-location';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_safe-refuge/artifacts/ywgi4kxk_Gemini_Generated_Image_529exc529exc529e.jpg';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, subscriptionStatus, setSubscriptionStatus } = useStore();
  const [weather, setWeather] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!deviceId) return;
    
    try {
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status);
      
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.softWhite}
            colors={[colors.warmBrown]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.headerLogo}
            contentFit="contain"
          />
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t('welcomeBack')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('howAreYou')}</Text>
          
          {/* Trial/Subscription Status */}
          {subscriptionStatus?.status === 'trial' && (
            <TouchableOpacity 
              style={styles.trialBadge}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="time-outline" size={16} color={colors.warmBrown} />
              <Text style={styles.trialText}>
                {t('trialRemaining')}: {formatTrialTime()}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.warmBrown} />
            </TouchableOpacity>
          )}

          {subscriptionStatus?.status === 'expired' && (
            <TouchableOpacity 
              style={[styles.trialBadge, styles.expiredBadge]}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.trialText, { color: colors.error }]}>
                {t('trialExpired')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <Ionicons 
              name={getWeatherIcon(weather.condition) as any} 
              size={28} 
              color={colors.warmBrown} 
            />
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.weatherDetail}>
                {t('humidity')}: {weather.humidity}%
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/diary/new')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8B5A2B' }]}>
                <Ionicons name="create-outline" size={26} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('writeEntry')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#B87333' }]}>
                <Ionicons name="leaf-outline" size={26} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('talkToAgora')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/patterns')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#D4956A' }]}>
                <Ionicons name="analytics-outline" size={26} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('viewPatterns')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/monthly-record')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8A8C6C' }]}>
                <Ionicons name="medical-outline" size={26} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('monthlyRecord')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Card */}
        <View style={styles.reminderCard}>
          <Ionicons name="heart" size={22} color={colors.warmBrown} />
          <Text style={styles.reminderText}>
            {t('dailyReminder')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossGreen,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLogo: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  expiredBadge: {
    backgroundColor: colors.accentLight,
  },
  trialText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.warmBrown,
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
    shadowRadius: 6,
    elevation: 2,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
  },
  weatherDetail: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
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
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
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
