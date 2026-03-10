import { useTrialCheck } from '../src/hooks/useTrialCheck';
import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Animated, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { useFonts } from 'expo-font';
import { 
  Cormorant_400Regular,
  Cormorant_500Medium,
  Cormorant_600SemiBold,
  Cormorant_700Bold 
} from '@expo-google-fonts/cormorant';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold
} from '@expo-google-fonts/nunito';
import { Image } from 'expo-image';
import i18n from '../src/i18n';
import { useStore } from '../src/store/useStore';
import { colors } from '../src/theme/colors';
import { getSubscriptionStatus } from '../src/services/api';
import { registerNotificationService } from '../src/services/notificationService';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { OnboardingScreen } from '../src/components/OnboardingScreen';

const LOGO_URL = require('../assets/images/agora-logo.png');

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { initializeDevice, setSubscriptionStatus, language } = useStore();
  const { hasSeenOnboarding, loading: onboardingLoading, markOnboardingAsShown } = useOnboarding();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [fontsLoaded] = useFonts({
    Cormorant_400Regular,
    Cormorant_500Medium,
    Cormorant_600SemiBold,
    Cormorant_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const deviceId = await initializeDevice();
        
        try {
          const status = await getSubscriptionStatus(deviceId);
          setSubscriptionStatus(status);
        } catch (error) {
          console.log('Error loading subscription status:', error);
        }
        
        i18n.changeLanguage(language);
        setIsReady(true);
        
        // Register notification service (web only)
        if (Platform.OS === 'web') {
          try {
            await registerNotificationService();
          } catch (error) {
            console.log('Notification service registration skipped:', error);
          }
        }
        
        // Start splash animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Hide splash after animation
        setTimeout(() => {
          setShowSplash(false);
        }, 2500);
        
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
        setShowSplash(false);
      }
    };
    
    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded]);

  const { isTrialExpired } = useTrialCheck();

  if (!fontsLoaded || onboardingLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.warmBrown} />
      </View>
    );
  }

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        <Animated.View 
          style={[
            styles.splashContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Image
            source={LOGO_URL}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={markOnboardingAsShown} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="light" />
        {isTrialExpired ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <View style={{ backgroundColor: colors.surface, padding: 32, borderRadius: 24, alignItems: 'center', shadowColor: colors.shadowDark, shadowOpacity: 0.2, shadowRadius: 12 }}>
              <Text style={{ fontSize: 22, fontFamily: 'Cormorant_700Bold', color: colors.error, marginBottom: 12 }}>
                {i18n.t('trialExpired')}
              </Text>
              <Text style={{ fontSize: 16, fontFamily: 'Nunito_400Regular', color: colors.textSecondary, marginBottom: 24, textAlign: 'center' }}>
                {i18n.t('continueUsing')}
              </Text>
              <TouchableOpacity style={{ backgroundColor: colors.mossGreen, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 }} onPress={() => {}}>
                <Text style={{ color: colors.softWhite, fontSize: 18, fontFamily: 'Nunito_600SemiBold' }}>{i18n.t('subscribe')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { 
                backgroundColor: colors.background,
                maxWidth: Platform.OS === 'web' ? 600 : '100%',
                alignSelf: 'center',
                width: '100%',
              },
              // 🚀 OPTIMIZACIÓN: Usar fade para transiciones más suaves =  mejor rendimiento
              animation: 'fade',
            }}
          >
            {/* Rutas principales - Cargan con el app */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Rutas modales - Lazy loaded por Expo Router automáticamente */}
            <Stack.Screen name="crisis" options={{ headerShown: false }} />
            <Stack.Screen 
              name="diary/new" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }} 
            />
            {/* 🚀 OPTIMIZACIÓN: Subscription es pesado, lazy loaded automáticamente */}
            <Stack.Screen 
              name="subscription" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }} 
            />
            
            {/* Rutas secundarias - Lazy loaded cuando se navega */}
            <Stack.Screen name="conversations/index" options={{ headerShown: false }} />
            <Stack.Screen name="cycle/index" options={{ headerShown: false }} />
            <Stack.Screen name="monthly-record/index" options={{ headerShown: false }} />
            <Stack.Screen name="resources/index" options={{ headerShown: false }} />
          </Stack>
        )}
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D4C8BE',
  },
  splashContent: {
    alignItems: 'center',
  },
  logo: {
    width: 420,
    height: 420,
    backgroundColor: 'transparent',
    resizeMode: 'contain',
  },
});
