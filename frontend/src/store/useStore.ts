import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired';
  trial_remaining_seconds?: number;
  usage_seconds?: number;
}

interface AppState {
  // Device
  deviceId: string | null;
  language: string;
  
  // Subscription
  subscriptionStatus: SubscriptionStatus | null;
  
  // UI State
  isLoading: boolean;
  
  // Actions
  initializeDevice: () => Promise<string>;
  setLanguage: (lang: string) => Promise<void>;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setLoading: (loading: boolean) => void;
  getDeviceId: () => Promise<string>;
}

// Helper for secure storage (works on web and native)
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  }
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  deviceId: null,
  language: 'es',
  subscriptionStatus: null,
  isLoading: false,
  
  // Initialize device ID (create if not exists)
  initializeDevice: async () => {
    try {
      let deviceId = await secureStorage.getItem('agora_device_id');
      
      if (!deviceId) {
        deviceId = uuidv4();
        await secureStorage.setItem('agora_device_id', deviceId);
      }
      
      // Load saved language
      const savedLang = await AsyncStorage.getItem('agora_language');
      
      set({ 
        deviceId,
        language: savedLang || 'es'
      });
      
      return deviceId;
    } catch (error) {
      console.error('Error initializing device:', error);
      const fallbackId = uuidv4();
      set({ deviceId: fallbackId });
      return fallbackId;
    }
  },
  
  // Get device ID (initialize if needed)
  getDeviceId: async () => {
    const state = get();
    if (state.deviceId) return state.deviceId;
    return state.initializeDevice();
  },
  
  // Set language
  setLanguage: async (lang: string) => {
    await AsyncStorage.setItem('agora_language', lang);
    set({ language: lang });
  },
  
  // Set subscription status
  setSubscriptionStatus: (status: SubscriptionStatus) => {
    set({ subscriptionStatus: status });
  },
  
  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));
