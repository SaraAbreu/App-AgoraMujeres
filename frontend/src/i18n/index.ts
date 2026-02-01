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
      chat: 'Ágora',
      patterns: 'Patrones',
      settings: 'Ajustes',
      
      // Home
      welcomeBack: 'Bienvenida de nuevo',
      howAreYou: '¿Cómo te sientes hoy?',
      quickActions: 'Acciones rápidas',
      writeEntry: 'Escribir en el diario',
      talkToAgora: 'Hablar con Ágora',
      viewPatterns: 'Ver patrones',
      wantToTalk: '¿Quieres hablar?',
      
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
      writeThoughts: '¿Qué llevas dentro hoy?',
      physicalState: 'Estado físico (opcional)',
      saveEntry: 'Guardar',
      entrySaved: 'Guardado con cariño',
      noEntries: 'Tu diario te espera',
      startWriting: 'Empieza a escribir cuando estés lista',
      
      // Chat
      chatWithAgora: 'Conversa con Ágora',
      agoraIntro: 'Hola, soy Ágora. Estoy aquí para escucharte y acompañarte en este momento. ¿Cómo puedo ayudarte hoy?',
      typeMessage: 'Escribe lo que sientes...',
      send: 'Enviar',
      agoraTyping: 'Ágora está escribiendo...',
      
      // Patterns
      weeklyPatterns: 'Tus patrones',
      emotionalTrends: 'Tendencias emocionales',
      physicalTrends: 'Tendencias físicas',
      commonWords: 'Palabras que más usas',
      noPatterns: 'Aún estamos conociéndonos',
      keepWriting: 'Sigue escribiendo para descubrir tus patrones',
      notablePattern: 'Patrón destacado',
      
      // Cycle
      cycleTracking: 'Seguimiento del ciclo',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
      addCycle: 'Añadir ciclo',
      noCycles: 'Sin registros de ciclo',
      
      // Resources
      resources: 'Recursos',
      
      // Settings
      language: 'Idioma',
      spanish: 'Español',
      english: 'English',
      subscription: 'Suscripción',
      trialRemaining: 'Tiempo de prueba',
      hours: 'horas',
      minutes: 'minutos',
      activateSubscription: 'Activar suscripción',
      subscriptionActive: 'Suscripción activa',
      priceMonthly: '10€/mes',
      
      // Subscription
      trialExpired: 'Tu prueba ha terminado',
      continueUsing: 'Para seguir usando Ágora, activa tu suscripción',
      subscribe: 'Suscribirse por 10€/mes',
      enterEmail: 'Tu correo electrónico',
      
      // Weather
      weather: 'Clima actual',
      temperature: 'Temperatura',
      humidity: 'Humedad',
      pressure: 'Presión',
      
      // Monthly Record
      monthlyRecord: 'Registro mensual',
      monthlyRecordTitle: 'Registro de dolor',
      monthlyRecordDesc: 'Para tu médico',
      
      // Motivational
      dailyReminder: 'Cada día cuenta, incluso los más difíciles. Estás haciendo un trabajo increíble.',
      
      // General
      loading: 'Cargando...',
      error: 'Ha ocurrido un error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      back: 'Volver',
      lastDays: 'últimos {{days}} días',
      entries: 'entradas',
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
      chat: 'Ágora',
      patterns: 'Patterns',
      settings: 'Settings',
      
      // Home
      welcomeBack: 'Welcome back',
      howAreYou: 'How are you feeling today?',
      quickActions: 'Quick actions',
      writeEntry: 'Write in your diary',
      talkToAgora: 'Talk to Ágora',
      viewPatterns: 'View patterns',
      wantToTalk: 'Want to talk?',
      
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
      writeThoughts: 'What\'s on your heart today?',
      physicalState: 'Physical state (optional)',
      saveEntry: 'Save',
      entrySaved: 'Saved with care',
      noEntries: 'Your diary awaits',
      startWriting: 'Start writing when you\'re ready',
      
      // Chat
      chatWithAgora: 'Chat with Ágora',
      agoraIntro: "Hello, I'm Ágora. I'm here to listen and walk alongside you in this moment. How can I help you today?",
      typeMessage: 'Share what you\'re feeling...',
      send: 'Send',
      agoraTyping: 'Ágora is typing...',
      
      // Patterns
      weeklyPatterns: 'Your patterns',
      emotionalTrends: 'Emotional trends',
      physicalTrends: 'Physical trends',
      commonWords: 'Words you use most',
      noPatterns: 'We\'re still getting to know each other',
      keepWriting: 'Keep writing to discover your patterns',
      notablePattern: 'Notable pattern',
      
      // Cycle
      cycleTracking: 'Cycle tracking',
      startDate: 'Start date',
      endDate: 'End date',
      addCycle: 'Add cycle',
      noCycles: 'No cycle records',
      
      // Resources
      resources: 'Resources',
      
      // Settings
      language: 'Language',
      spanish: 'Español',
      english: 'English',
      subscription: 'Subscription',
      trialRemaining: 'Trial time left',
      hours: 'hours',
      minutes: 'minutes',
      activateSubscription: 'Activate subscription',
      subscriptionActive: 'Subscription active',
      priceMonthly: '€10/month',
      
      // Subscription
      trialExpired: 'Your trial has ended',
      continueUsing: 'To continue using Ágora, activate your subscription',
      subscribe: 'Subscribe for €10/month',
      enterEmail: 'Your email address',
      
      // Weather
      weather: 'Current weather',
      temperature: 'Temperature',
      humidity: 'Humidity',
      pressure: 'Pressure',
      
      // Monthly Record
      monthlyRecord: 'Monthly record',
      monthlyRecordTitle: 'Pain record',
      monthlyRecordDesc: 'For your doctor',
      
      // Motivational
      dailyReminder: 'Every day counts, even the hardest ones. You are doing an amazing job.',
      
      // General
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Confirm',
      back: 'Back',
      lastDays: 'last {{days}} days',
      entries: 'entries',
    }
  }
};

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
