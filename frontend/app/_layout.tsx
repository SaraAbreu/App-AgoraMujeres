import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
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

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_safe-refuge/artifacts/ywgi4kxk_Gemini_Generated_Image_529exc529exc529e.jpg';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { initializeDevice, setSubscriptionStatus, language } = useStore();
  
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

  if (!fontsLoaded) {
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
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="diary/new" 
            options={{ 
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }} 
          />
          <Stack.Screen 
            name="subscription" 
            options={{ 
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }} 
          />
        </Stack>
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
    backgroundColor: '#D4C8BE', // Beige from reference
  },
  splashContent: {
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 280,
    borderRadius: 20,
  },
});
