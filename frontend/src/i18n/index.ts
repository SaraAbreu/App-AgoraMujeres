import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  es: {
    translation: {
      // App
      appName: 'Ágora Mujeres',
      tagline: 'Tu refugio emocional',
      
      // Navigation
      home: 'Refugio',
      diary: 'Diario',
      chat: 'Aurora',
      patterns: 'Patrones',
      settings: 'Ajustes',
      
      // Home
      welcomeBack: 'Bienvenida de nuevo',
      howAreYou: '¿Cómo te sientes hoy?',
      quickActions: 'Acciones rápidas',
      writeEntry: 'Escribir en el diario',
      talkToAurora: 'Hablar con Aurora',
      viewPatterns: 'Ver patrones',
      
      // Emotional States
      calma: 'Calma',
      fatiga: 'Fatiga',
      niebla_mental: 'Niebla mental',
      dolor_difuso: 'Dolor difuso',
      gratitud: 'Gratitud',
      tension: 'Tensión',
      
      // Physical States
      nivel_dolor: 'Nivel de dolor',
      energia: 'Energía',
      sensibilidad: 'Sensibilidad',
      
      // Diary
      newEntry: 'Nueva entrada',
      howDoYouFeel: '¿Cómo te sientes?',
      writeThoughts: 'Escribe lo que sientes...',
      physicalState: 'Estado físico (opcional)',
      saveEntry: 'Guardar',
      entrySaved: 'Entrada guardada',
      noEntries: 'Aún no tienes entradas',
      startWriting: 'Empieza a escribir tu primera entrada',
      
      // Chat
      chatWithAurora: 'Conversa con Aurora',
      auroraIntro: 'Hola, soy Aurora. Estoy aquí para escucharte y acompañarte. ¿Cómo puedo ayudarte hoy?',
      typeMessage: 'Escribe tu mensaje...',
      send: 'Enviar',
      
      // Patterns
      weeklyPatterns: 'Patrones semanales',
      emotionalTrends: 'Tendencias emocionales',
      physicalTrends: 'Tendencias físicas',
      commonWords: 'Palabras frecuentes',
      noPatterns: 'Aún no hay suficientes datos',
      keepWriting: 'Sigue escribiendo en tu diario para ver tus patrones',
      
      // Cycle
      cycleTracking: 'Seguimiento del ciclo',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
      addCycle: 'Añadir ciclo',
      noCycles: 'Sin registros de ciclo',
      
      // Settings
      language: 'Idioma',
      spanish: 'Español',
      english: 'English',
      subscription: 'Suscripción',
      trialRemaining: 'Tiempo de prueba restante',
      hours: 'horas',
      minutes: 'minutos',
      activateSubscription: 'Activar suscripción',
      subscriptionActive: 'Suscripción activa',
      priceMonthly: '10€/mes',
      
      // Subscription
      trialExpired: 'Tu período de prueba ha terminado',
      continueUsing: 'Para continuar usando Ágora, activa tu suscripción',
      subscribe: 'Suscribirse por 10€/mes',
      enterEmail: 'Tu correo electrónico',
      
      // Weather
      weather: 'Clima actual',
      temperature: 'Temperatura',
      humidity: 'Humedad',
      pressure: 'Presión',
      
      // General
      loading: 'Cargando...',
      error: 'Ha ocurrido un error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      back: 'Volver',
    }
  },
  en: {
    translation: {
      // App
      appName: 'Ágora Mujeres',
      tagline: 'Your emotional refuge',
      
      // Navigation
      home: 'Refuge',
      diary: 'Diary',
      chat: 'Aurora',
      patterns: 'Patterns',
      settings: 'Settings',
      
      // Home
      welcomeBack: 'Welcome back',
      howAreYou: 'How are you feeling today?',
      quickActions: 'Quick actions',
      writeEntry: 'Write in diary',
      talkToAurora: 'Talk to Aurora',
      viewPatterns: 'View patterns',
      
      // Emotional States
      calma: 'Calm',
      fatiga: 'Fatigue',
      niebla_mental: 'Brain fog',
      dolor_difuso: 'Diffuse pain',
      gratitud: 'Gratitude',
      tension: 'Tension',
      
      // Physical States
      nivel_dolor: 'Pain level',
      energia: 'Energy',
      sensibilidad: 'Sensitivity',
      
      // Diary
      newEntry: 'New entry',
      howDoYouFeel: 'How do you feel?',
      writeThoughts: 'Write what you feel...',
      physicalState: 'Physical state (optional)',
      saveEntry: 'Save',
      entrySaved: 'Entry saved',
      noEntries: 'No entries yet',
      startWriting: 'Start writing your first entry',
      
      // Chat
      chatWithAurora: 'Chat with Aurora',
      auroraIntro: "Hi, I'm Aurora. I'm here to listen and accompany you. How can I help you today?",
      typeMessage: 'Type your message...',
      send: 'Send',
      
      // Patterns
      weeklyPatterns: 'Weekly patterns',
      emotionalTrends: 'Emotional trends',
      physicalTrends: 'Physical trends',
      commonWords: 'Common words',
      noPatterns: 'Not enough data yet',
      keepWriting: 'Keep writing in your diary to see your patterns',
      
      // Cycle
      cycleTracking: 'Cycle tracking',
      startDate: 'Start date',
      endDate: 'End date',
      addCycle: 'Add cycle',
      noCycles: 'No cycle records',
      
      // Settings
      language: 'Language',
      spanish: 'Español',
      english: 'English',
      subscription: 'Subscription',
      trialRemaining: 'Trial time remaining',
      hours: 'hours',
      minutes: 'minutes',
      activateSubscription: 'Activate subscription',
      subscriptionActive: 'Subscription active',
      priceMonthly: '€10/month',
      
      // Subscription
      trialExpired: 'Your trial period has ended',
      continueUsing: 'To continue using Ágora, activate your subscription',
      subscribe: 'Subscribe for €10/month',
      enterEmail: 'Your email address',
      
      // Weather
      weather: 'Current weather',
      temperature: 'Temperature',
      humidity: 'Humidity',
      pressure: 'Pressure',
      
      // General
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Confirm',
      back: 'Back',
    }
  }
};

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'es';
const defaultLanguage = ['es', 'en'].includes(deviceLanguage) ? deviceLanguage : 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    compatibilityJSON: 'v4'
  });

export default i18n;
