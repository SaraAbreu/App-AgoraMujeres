import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
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
import i18n from '../src/i18n';
import { useStore } from '../src/store/useStore';
import { colors, typography } from '../src/theme/colors';
import { getSubscriptionStatus } from '../src/services/api';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { initializeDevice, setSubscriptionStatus, language } = useStore();

  // Load custom fonts
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
        
        // Load subscription status
        try {
          const status = await getSubscriptionStatus(deviceId);
          setSubscriptionStatus(status);
        } catch (error) {
          console.log('Error loading subscription status:', error);
        }
        
        // Change i18n language
        i18n.changeLanguage(language);
        
        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true);
      }
    };
    
    init();
  }, []);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Ágora Mujeres</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="dark" />
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
  loadingText: {
    marginTop: 16,
    fontSize: 24,
    color: colors.primary,
    fontFamily: 'Cormorant_600SemiBold',
  },
});
