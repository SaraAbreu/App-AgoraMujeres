import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getSubscriptionStatus, getWeather } from '../../src/services/api';
import { WeeklyStatsCard } from '../../src/components/WeeklyStatsCard';
import * as Location from 'expo-location';

const LOGO_URL = require('../../assets/images/agora-logo.png');
const ICON_SIZE = Platform.OS === 'web' ? 28 : 24;
const isWeb = Platform.OS === 'web';
const screenWidth = Dimensions.get('window').width;
const MAX_WIDTH = isWeb ? 1200 : 800;

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
            source={LOGO_URL}
            style={styles.headerLogo as any}
            contentFit="contain"
          />
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t('appName')}</Text>
          <Text style={styles.tagline}>
            {t('tagline')}
          </Text>
          
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

        {/* Motivational Card */}
        <View style={styles.reminderCard}>
          <Ionicons name="heart" size={22} color={colors.warmBrown} />
          <Text style={styles.reminderText}>
            {t('dailyReminder')}
          </Text>
        </View>

        {/* Crisis Button - Visible & Accessible */}
        <TouchableOpacity
          style={styles.crisisButton}
          onPress={() => router.push('/crisis')}
          activeOpacity={0.75}
        >
          <Ionicons name="alert-circle" size={22} color={colors.softWhite} />
          <Text style={styles.crisisButtonText}>{t('hurtsEverywhere')}</Text>
          <Text style={styles.crisisButtonSub}>{t('hurtsEverywhereSub')}</Text>
        </TouchableOpacity>


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
                <Ionicons name="create-outline" size={ICON_SIZE} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('writeEntry')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#B87333' }]}>
                <Ionicons name="leaf-outline" size={ICON_SIZE} color={colors.softWhite} />
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
                <Ionicons name="analytics-outline" size={ICON_SIZE} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('viewPatterns')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/monthly-record')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8A8C6C' }]}>
                <Ionicons name="medical-outline" size={ICON_SIZE} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('monthlyRecord')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/resources')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#9E7B5D' }]}>
                <Ionicons name="library-outline" size={ICON_SIZE} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('resources')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/cycle')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#A67C5B' }]}>
                <Ionicons name="calendar-outline" size={ICON_SIZE} color={colors.softWhite} />
              </View>
              <Text style={styles.actionTitle}>{t('cycleTracking')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats Card */}
        <WeeklyStatsCard deviceId={deviceId} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#80704f',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: isWeb ? Math.max(spacing.lg, (screenWidth - MAX_WIDTH) / 2) : spacing.lg,
    paddingVertical: isWeb ? spacing.xl : spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: isWeb ? spacing.md : spacing.lg,
    backgroundColor: 'transparent',
  },
  headerLogo: {
    width: isWeb ? 240 : 320,
    height: isWeb ? 240 : 320,
    backgroundColor: 'transparent',
    resizeMode: 'contain',
  },
  tagline: {
    fontSize: isWeb ? 16 : typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: '#8B5A2B',
    textAlign: 'center',
    marginTop: isWeb ? 0 : spacing.xs,
    marginBottom: isWeb ? spacing.lg : spacing.md,
    fontStyle: 'italic',
    lineHeight: isWeb ? 22 : 20,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    padding: isWeb ? spacing.md : spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: isWeb ? 22 : typography.sizes.md,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
    textAlign: 'center',
    lineHeight: isWeb ? 28 : 26,
  },
  howAreYouCard: {
    backgroundColor: colors.surface,
    padding: isWeb ? spacing.md : spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  howAreYouText: {
    fontSize: isWeb ? 16 : typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    lineHeight: 24,
  },
  crisisButton: {
    backgroundColor: '#8B5A2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isWeb ? spacing.lg : spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  crisisButtonText: {
    color: colors.softWhite,
    fontSize: isWeb ? 17 : typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
  },
  quickEntryCard: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isWeb ? spacing.lg : spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warmBrown,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  quickEntryTitle: {
    fontSize: isWeb ? 16 : typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  quickEntrySubtitle: {
    fontSize: isWeb ? 14 : typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  quickEntryButton: {
    backgroundColor: colors.warmBrown,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignSelf: 'center',
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
    padding: isWeb ? spacing.lg : spacing.md,
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
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    lineHeight: 22,
  },
  weatherDetail: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: isWeb ? 26 : typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
    lineHeight: isWeb ? 30 : 28,
  },
  actionsGrid: {
    marginBottom: spacing.lg,
    gap: isWeb ? 12 : 8,
    flexWrap: isWeb ? 'wrap' : undefined,
    flexDirection: isWeb ? 'row' : undefined,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: isWeb ? 16 : 0,
    justifyContent: isWeb ? 'space-around' : 'space-between',
    width: isWeb ? '100%' : undefined,
  },
  actionCard: {
    flex: isWeb ? undefined : 1,
    width: isWeb ? '33.33%' : undefined,
    backgroundColor: colors.surface,
    padding: isWeb ? spacing.md : spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    minHeight: isWeb ? 130 : 100,
    marginHorizontal: isWeb ? 1 : undefined,
  },
  actionIcon: {
    width: isWeb ? 56 : 52,
    height: isWeb ? 56 : 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: isWeb ? 14 : typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: isWeb ? spacing.xl : spacing.lg,
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
    fontSize: isWeb ? 15 : typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  crisisButtonSub: {
    fontSize: isWeb ? 12 : 11,
    fontFamily: 'Nunito_400Regular',
    color: colors.softWhite,
    opacity: 0.9,
    lineHeight: 16,
  },
});
