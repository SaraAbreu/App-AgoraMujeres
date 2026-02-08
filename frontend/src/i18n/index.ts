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
      howAreYou: 'Hoy puede ser un día difícil, regular o bueno. Sea cual sea, tu voz importa aquí.',
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
      
      // Physical States
      nivel_dolor: 'Nivel de dolor',
      energia: 'Energía',
      sensibilidad: 'Sensibilidad',
      
      // Diary
      newEntry: 'Nueva entrada',
      howDoYouFeel: '¿Cómo te sientes?',
      writeThoughts: 'Desahógate sin filtro. Aquí no tienes que explicar, justificar ni ser fuerte.',
      writeQuick: 'Cuéntame rápido: ¿Cómo está tu dolor? ¿Y tu ánimo?',
      physicalState: 'Estado físico (opcional)',
      saveEntry: 'Guardar',
      entrySaved: 'Guardado con cariño',
      noEntries: 'Tu diario te espera',
      startWriting: 'Empieza a escribir cuando estés lista',
      
      // Chat
      chatWithAgora: 'Conversa con Ágora',
      agoraIntro: 'Hola, soy Ágora. Estoy aquí 24/7 para escucharte sin juzgar, acompañarte en tus días malos, celebrar los buenos, y simplemente estar cuando lo necesites. Yo NO soy terapeuta, pero sí soy tu apoyo. ¿Cómo prefieres que te hable hoy? ¿Buscas desahogarte o prefieres consejos?',
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
      dailyReminder: 'Día de mucho dolor, de niebla mental, o simplemente de dificultad. Sea cual sea, llegas aquí. Eso es toda la victoria que necesitas hoy.',
      
      // Crisis & Support
      inCrisis: '¿Estás en crisis?',
      crisisMessage: 'Tu vida importa. Hay gente que puede ayudarte ahora mismo.',
      needProfessional: 'Necesito hablar con un profesional',
      
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
      howAreYou: 'Today might be a hard day, an okay day, or a good day. Whatever it is, your voice matters here.',
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
      
      // Physical States
      nivel_dolor: 'Pain level',
      energia: 'Energy',
      sensibilidad: 'Sensitivity',
      
      // Diary
      newEntry: 'New entry',
      howDoYouFeel: 'How do you feel?',
      writeThoughts: 'Share without filter. You don\'t have to explain, justify, or be strong here.',
      writeQuick: 'Tell me quickly: How\'s your pain? And your mood?',
      physicalState: 'Physical state (optional)',
      saveEntry: 'Save',
      entrySaved: 'Saved with care',
      noEntries: 'Your diary awaits',
      startWriting: 'Start writing when you\'re ready',
      
      // Chat
      chatWithAgora: 'Chat with Ágora',
      agoraIntro: "Hello, I'm Ágora. I'm here 24/7 to listen without judgment, walk with you through your hard days, celebrate the good ones, and simply be there when you need me. I'm NOT a therapist, but I am your support. How would you prefer I talk to you today? Do you want to share what\'s on your mind, or would talking through it help?",
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
