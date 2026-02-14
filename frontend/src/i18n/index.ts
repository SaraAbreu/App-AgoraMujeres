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
      welcomeBack: 'Bienvenida, tu refugio está aquí',
      howAreYou: 'Hoy puede ser un día difícil, regular o bueno. Sea como sea, aquí tienes un espacio para ti.',
      quickEntry: 'Entrada rápida (30 segundos)',
      needHelp: 'Necesito ayuda ahora',
      crisisSupport: 'Centro de Crisis',
      emergencyText: 'Si estás en crisis, aquí hay apoyo inmediato',
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
      saturada: 'Me siento saturada',
      desconectada: 'Me siento desconectada',
      sensible: 'Me siento sensible',
      abrumada: 'Me siento abrumada',
      vulnerable: 'Me siento vulnerable',
      tranquila: 'Me siento tranquila',
      
      // Physical States
      nivel_dolor: 'Nivel de dolor',
      energia: 'Energía',
      sensibilidad: 'Sensibilidad',
      
      // Diary
      newEntry: 'Nueva entrada',
      howDoYouFeel: '¿Cómo te sientes?',
      writeThoughts: 'Desahógate sin filtro. Aquí no tienes que explicar, justificar ni ser fuerte.',
      writeQuick: 'Si quieres, cuéntame cómo te sientes hoy.',
      physicalState: 'Estado físico (opcional)',
      saveEntry: 'Guardar',
      entrySaved: 'Guardado con cariño',
      noEntries: 'Tu diario te espera',
      startWriting: 'Empieza a escribir cuando estés lista',
      
      // Chat
      chatWithAgora: 'Conversa con Ágora',
      agoraIntro: 'Hola. Soy Ágora, tu compañera en este camino. Sé que hay días difíciles y otros un poco mejores. ¿Cómo estás hoy?',
      justListen: 'Solo escúchame, sin soluciones',
      giveAdvice: 'Ayúdame a pensar diferente',
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
      dailyReminder: 'Hoy puede ser un día difícil, regular o bueno. Sea como sea, aquí tienes un espacio para ti.',
      
      // Crisis & Support
      inCrisis: '¿Estás en crisis?',
      crisisMessage: 'Tu vida importa. Hay gente que puede ayudarte ahora mismo.',
      needProfessional: 'Necesito hablar con un profesional',
      hurtsEverywhere: 'Me duele todo',
      hurtsEverywhereSub: 'Cuando el dolor es insoportable',
      crisisQuick: 'El dolor que sientes es REAL y completamente válido. Estoy aquí contigo ahora.',
      
      // Community & Social
      communitySize: 'Eres parte de una comunidad de {{count}} mujeres que entienden fibromialgia',
      communityHint: 'Muchas en la red tuvieron tu mismo nivel de dolor hoy',
      
      // Data Summary
      weeklyStats: 'Esta semana:',
      goodDays: 'Días buenos',
      difficultDays: 'Días difíciles',
      averagePain: 'Dolor promedio',
      topEmotion: 'Emoción más frecuente',
      keepWriting: 'Sigue escribiendo para descubrir tus patrones',
      
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
      welcomeBack: 'Welcome back, your refuge is here',
      howAreYou: 'Today might be a hard day, an okay day, or a good day. Whatever it is, here you have a space for yourself.',
      quickEntry: 'Quick entry (30 seconds)',
      needHelp: 'I need help now',
      crisisSupport: 'Crisis Support',
      emergencyText: 'If you\'re in crisis, immediate support is here',
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
      saturada: 'I feel overwhelmed',
      desconectada: 'I feel disconnected',
      sensible: 'I feel sensitive',
      abrumada: 'I feel overwhelmed',
      vulnerable: 'I feel vulnerable',
      tranquila: 'I feel calm',
      
      // Physical States
      nivel_dolor: 'Pain level',
      energia: 'Energy',
      sensibilidad: 'Sensitivity',
      
      // Diary
      newEntry: 'New entry',
      howDoYouFeel: 'How do you feel?',
      writeThoughts: 'Share without filter. You don\'t have to explain, justify, or be strong here.',
      writeQuick: 'If you want, tell me how you\'re feeling today.',
      physicalState: 'Physical state (optional)',
      saveEntry: 'Save',
      entrySaved: 'Saved with care',
      noEntries: 'Your diary awaits',
      startWriting: 'Start writing when you\'re ready',
      
      // Chat
      chatWithAgora: 'Chat with Ágora',
      agoraIntro: "Hi, I'm Ágora. I'm here for you, without judgment. How are you feeling today?",
      justListen: 'Just listen to me, no solutions',
      giveAdvice: 'Help me think differently',
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
      dailyReminder: 'A high-pain day, a brain fog day, or simply a hard day. Whatever it is, you\'re here. That\'s all the victory you need today.',
      
      // Crisis & Support
      inCrisis: 'Are you in crisis?',
      crisisMessage: 'Your life matters. There are people who can help you right now.',
      needProfessional: 'I need to talk to a professional',
      hurtsEverywhere: 'Everything hurts',
      hurtsEverywhereSub: 'When pain is unbearable',
      crisisQuick: 'The pain you feel is REAL and completely valid. I\'m here with you now.',
      
      // Community & Social
      communitySize: 'You\'re part of a community of {{count}} women who understand fibromyalgia',
      communityHint: 'Many in the network felt the same pain level as you today',
      
      // Data Summary
      weeklyStats: 'This week:',
      goodDays: 'Good days',
      difficultDays: 'Difficult days',
      averagePain: 'Average pain',
      topEmotion: 'Most frequent emotion',
      keepWriting: 'Keep writing to discover your patterns',
      
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
