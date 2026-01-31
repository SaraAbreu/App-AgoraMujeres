import axios from 'axios';
import Constants from 'expo-constants';

// Get the API URL from environment
const getApiUrl = () => {
  // First try extra config from app.json
  const extraUrl = Constants.expoConfig?.extra?.EXPO_BACKEND_URL;
  if (extraUrl) {
    console.log('[API] Using extra config URL:', extraUrl);
    return extraUrl;
  }
  
  // Then try environment variables
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    console.log('[API] Using env URL:', envUrl);
    return envUrl;
  }
  
  // Fallback for development (empty string means relative URL)
  console.log('[API] Using relative URL (fallback)');
  return '';
};

const API_BASE = getApiUrl();
console.log('[API] Final base URL:', API_BASE);

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface EmotionalState {
  calma: number;
  fatiga: number;
  niebla_mental: number;
  dolor_difuso: number;
  gratitud: number;
  tension: number;
}

export interface PhysicalState {
  nivel_dolor: number;
  energia: number;
  sensibilidad: number;
}

export interface DiaryEntry {
  id: string;
  device_id: string;
  texto?: string;
  emotional_state: EmotionalState;
  physical_state?: PhysicalState;
  weather?: any;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired';
  trial_remaining_seconds?: number;
  usage_seconds?: number;
}

export interface CycleEntry {
  id: string;
  device_id: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

export interface Weather {
  temperature: number;
  humidity: number;
  pressure: number;
  condition: string;
}

export interface Patterns {
  period_days: number;
  total_entries: number;
  emotional_averages: EmotionalState;
  physical_averages?: PhysicalState;
  common_words: [string, number][];
  trends: {
    highest_emotional: string;
    lowest_emotional: string;
  };
}

export interface MonthlyPainRecord {
  device_id: string;
  records: Array<{
    date: string;
    intensity: number;
    notes?: string;
  }>;
  cycle_start_date: string;
  created_at?: string;
}

// API Functions

// Diary
export const createDiaryEntry = async (entry: {
  device_id: string;
  texto?: string;
  emotional_state: EmotionalState;
  physical_state?: PhysicalState;
  weather?: any;
}): Promise<DiaryEntry> => {
  const response = await api.post('/diary', entry);
  return response.data;
};

export const getDiaryEntries = async (deviceId: string, limit = 30, offset = 0): Promise<DiaryEntry[]> => {
  const response = await api.get(`/diary/${deviceId}`, { params: { limit, offset } });
  return response.data;
};

export const getPatterns = async (deviceId: string, days = 7): Promise<Patterns> => {
  const response = await api.get(`/diary/${deviceId}/patterns`, { params: { days } });
  return response.data;
};

// Chat
export const sendChatMessage = async (deviceId: string, message: string, language: string): Promise<{ response: string; requires_subscription: boolean }> => {
  const response = await api.post('/chat', {
    device_id: deviceId,
    message,
    language
  });
  return response.data;
};

export const getChatHistory = async (deviceId: string, limit = 50): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/${deviceId}/history`, { params: { limit } });
  return response.data;
};

// Subscription
export const getSubscriptionStatus = async (deviceId: string): Promise<SubscriptionStatus> => {
  const response = await api.get(`/subscription/${deviceId}`);
  return response.data;
};

export const createCustomer = async (deviceId: string, email: string, name?: string): Promise<{ customer_id: string }> => {
  const response = await api.post('/subscription/create-customer', {
    device_id: deviceId,
    email,
    name
  });
  return response.data;
};

export const createPaymentIntent = async (deviceId: string): Promise<{ client_secret: string; payment_intent_id: string }> => {
  const response = await api.post('/subscription/create-payment-intent', null, {
    params: { device_id: deviceId }
  });
  return response.data;
};

export const activateSubscription = async (deviceId: string, paymentIntentId: string): Promise<{ status: string }> => {
  const response = await api.post('/subscription/activate', null, {
    params: { device_id: deviceId, payment_intent_id: paymentIntentId }
  });
  return response.data;
};

// Cycle
export const createCycleEntry = async (entry: {
  device_id: string;
  start_date: string;
  end_date?: string;
  notes?: string;
}): Promise<CycleEntry> => {
  const response = await api.post('/cycle', entry);
  return response.data;
};

export const getCycleEntries = async (deviceId: string, limit = 12): Promise<CycleEntry[]> => {
  const response = await api.get(`/cycle/${deviceId}`, { params: { limit } });
  return response.data;
};

// Weather
export const getWeather = async (lat: number, lon: number): Promise<Weather> => {
  const response = await api.get('/weather', { params: { lat, lon } });
  return response.data;
};

// Monthly Pain Record
export const getMonthlyRecord = async (deviceId: string): Promise<MonthlyPainRecord | null> => {
  try {
    const response = await api.get(`/monthly-record/${deviceId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const saveMonthlyRecord = async (deviceId: string, data: {
  records: Array<{ date: string; intensity: number; notes?: string }>;
  cycle_start_date: string;
}): Promise<MonthlyPainRecord> => {
  const response = await api.post(`/monthly-record/${deviceId}`, data);
  return response.data;
};

export default api;
