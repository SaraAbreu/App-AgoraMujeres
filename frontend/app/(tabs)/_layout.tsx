import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { Platform } from 'react-native';
import { useTrialCheck } from '../../src/hooks/useTrialCheck';
import { PaywallModal } from '../../src/components/PaywallModal';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isTrialExpired, isSubscribed } = useTrialCheck();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    // Show paywall when trial expires (but not if subscribed)
    if (isTrialExpired && !isSubscribed) {
      setShowPaywall(true);
    }
  }, [isTrialExpired, isSubscribed]);

  return (
    <>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.softWhite,
        tabBarInactiveTintColor: colors.mossGreenLight,
        tabBarStyle: {
          backgroundColor: colors.mossGreenDark,
          borderTopWidth: 0,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          height: Platform.OS === 'ios' ? 95 : 70,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Nunito_500Medium',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        headerStyle: {
          backgroundColor: colors.mossGreen,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textOnDark,
        headerTitleStyle: {
          fontFamily: 'Cormorant_600SemiBold',
          fontSize: 22,
          color: colors.textOnDark,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: t('diary'),
          headerTitle: t('diary'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('chat'),
          headerTitle: t('chatWithAgora'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: t('patterns'),
          headerTitle: t('weeklyPatterns'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          headerTitle: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
