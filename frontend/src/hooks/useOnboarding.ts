import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ONBOARDING_SHOWN_KEY = 'agora_onboarding_shown';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      // RESET: Siempre mostrar onboarding en web durante desarrollo
      if (typeof window !== 'undefined') {
        setHasSeenOnboarding(false);
        setLoading(false);
        return;
      }
      
      const shown = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
      setHasSeenOnboarding(shown === 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setHasSeenOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const markOnboardingAsShown = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error marking onboarding as shown:', error);
    }
  };

  return {
    hasSeenOnboarding,
    loading,
    markOnboardingAsShown,
  };
}
