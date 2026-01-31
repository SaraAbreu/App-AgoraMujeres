import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { createDiaryEntry, getWeather, EmotionalState, PhysicalState } from '../../src/services/api';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// Emotion categories with their properties
const emotionCategories = {
  calming: {
    title_es: 'Emociones calmantes',
    title_en: 'Calming emotions',
    color: '#A8D5BA',
    emotions: [
      { key: 'calma', label_es: 'Calma', label_en: 'Calm', question_es: '¿Cuánta calma sientes hoy?', question_en: 'How much calm do you feel today?' },
      { key: 'gratitud', label_es: 'Gratitud', label_en: 'Gratitude', question_es: '¿Cuánta gratitud sientes?', question_en: 'How much gratitude do you feel?' },
    ]
  },
  cognitive: {
    title_es: 'Estados cognitivos',
    title_en: 'Cognitive states',
    color: '#B8AFA7',
    emotions: [
      { key: 'niebla_mental', label_es: 'Niebla mental', label_en: 'Brain fog', question_es: '¿Cómo está tu claridad mental?', question_en: 'How is your mental clarity?' },
    ]
  },
  physical: {
    title_es: 'Síntomas físicos',
    title_en: 'Physical symptoms',
    color: '#D4B896',
    emotions: [
      { key: 'fatiga', label_es: 'Fatiga', label_en: 'Fatigue', question_es: 'Escucha tu cuerpo sin prisa', question_en: 'Listen to your body without rush' },
      { key: 'dolor_difuso', label_es: 'Dolor difuso', label_en: 'Diffuse pain', question_es: '¿Cómo sientes tu cuerpo?', question_en: 'How does your body feel?' },
    ]
  },
  tension: {
    title_es: 'Tensión emocional',
    title_en: 'Emotional tension',
    color: '#C9A587',
    emotions: [
      { key: 'tension', label_es: 'Tensión', label_en: 'Tension', question_es: '¿Cuánta tensión llevas dentro?', question_en: 'How much tension are you carrying?' },
    ]
  }
};

// Intensity levels for physical symptoms
const intensityLevels = [
  { value: 1, label_es: 'Suave', label_en: 'Mild' },
  { value: 3, label_es: 'Medio', label_en: 'Moderate' },
  { value: 5, label_es: 'Intenso', label_en: 'Intense' },
];

export default function NewDiaryEntry() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language } = useStore();
  
  const [texto, setTexto] = useState('');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    calma: 0,
    fatiga: 0,
    niebla_mental: 0,
    dolor_difuso: 0,
    gratitud: 0,
    tension: 0,
  });
  const [physicalState, setPhysicalState] = useState<PhysicalState>({
    nivel_dolor: 0,
    energia: 5,
    sensibilidad: 0,
  });
  const [expandedEmotion, setExpandedEmotion] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const expandAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animations for each emotion
  Object.values(emotionCategories).forEach(category => {
    category.emotions.forEach(emotion => {
      if (!expandAnims[emotion.key]) {
        expandAnims[emotion.key] = new Animated.Value(0);
      }
    });
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await getWeather(location.coords.latitude, location.coords.longitude);
        setWeather(weatherData);
      }
    } catch (e) {
      console.log('Weather not available');
    }
  };

  const toggleEmotion = (key: string) => {
    if (expandedEmotion === key) {
      // Collapse
      Animated.timing(expandAnims[key], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setExpandedEmotion(null));
    } else {
      // Collapse previous if any
      if (expandedEmotion && expandAnims[expandedEmotion]) {
        Animated.timing(expandAnims[expandedEmotion], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      setExpandedEmotion(key);
      Animated.timing(expandAnims[key], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleEmotionChange = (key: keyof EmotionalState, value: number) => {
    setEmotionalState(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!deviceId) return;
    
    setSaving(true);
    try {
      await createDiaryEntry({
        device_id: deviceId,
        texto: texto.trim() || undefined,
        emotional_state: emotionalState,
        physical_state: physicalState,
        weather: weather || undefined,
      });
      
      Alert.alert(
        '',
        language === 'es' ? 'Guardado con cariño' : 'Saved with care',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert(
        '',
        language === 'es' ? 'No se pudo guardar' : 'Could not save'
      );
    } finally {
      setSaving(false);
    }
  };

  const goToChat = () => {
    router.replace('/(tabs)/chat');
  };

  const renderEmotionBubble = (emotion: any, categoryColor: string, isPhysical: boolean = false) => {
    const isExpanded = expandedEmotion === emotion.key;
    const value = emotionalState[emotion.key as keyof EmotionalState];
    const label = language === 'es' ? emotion.label_es : emotion.label_en;
    const question = language === 'es' ? emotion.question_es : emotion.question_en;
    
    const expandHeight = expandAnims[emotion.key]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, isPhysical ? 80 : 100],
    }) || 0;

    return (
      <View key={emotion.key} style={styles.emotionBubbleContainer}>
        <TouchableOpacity
          style={[
            styles.emotionBubble,
            { backgroundColor: value > 0 ? categoryColor : colors.surface },
            value > 0 && styles.emotionBubbleActive
          ]}
          onPress={() => toggleEmotion(emotion.key)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.emotionBubbleText,
            { color: value > 0 ? colors.softWhite : colors.text }
          ]}>
            {label}
          </Text>
          {value > 0 && (
            <View style={styles.emotionValueBadge}>
              <Text style={styles.emotionValueText}>{value}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Animated.View style={[styles.emotionExpanded, { height: expandHeight, opacity: expandAnims[emotion.key] }]}>
          {isExpanded && (
            <View style={styles.emotionExpandedContent}>
              <Text style={styles.emotionQuestion}>{question}</Text>
              
              {isPhysical ? (
                // Intensity selector for physical symptoms
                <View style={styles.intensityContainer}>
                  {intensityLevels.map((level) => (
                    <TouchableOpacity
                      key={level.value}
                      style={[
                        styles.intensityButton,
                        value === level.value && { backgroundColor: categoryColor }
                      ]}
                      onPress={() => handleEmotionChange(emotion.key as keyof EmotionalState, level.value)}
                    >
                      <Text style={[
                        styles.intensityText,
                        value === level.value && { color: colors.softWhite }
                      ]}>
                        {language === 'es' ? level.label_es : level.label_en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                // Slider for other emotions
                <View style={styles.sliderTrack}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.sliderDot,
                        { backgroundColor: value >= level ? categoryColor : colors.border }
                      ]}
                      onPress={() => handleEmotionChange(emotion.key as keyof EmotionalState, level)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const renderCategory = (categoryKey: string, category: any) => {
    const title = language === 'es' ? category.title_es : category.title_en;
    const isPhysical = categoryKey === 'physical';
    
    return (
      <View key={categoryKey} style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <View style={styles.emotionBubblesRow}>
          {category.emotions.map((emotion: any) => 
            renderEmotionBubble(emotion, category.color, isPhysical)
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.textOnDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('newEntry')}</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.softWhite} />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Animated.ScrollView 
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Emotional Header */}
          <View style={styles.emotionalHeader}>
            <Text style={styles.emotionalTitle}>
              {language === 'es' ? 'Tómate un momento para escucharte' : 'Take a moment to listen to yourself'}
            </Text>
            <Text style={styles.emotionalSubtitle}>
              {language === 'es' ? '¿Cómo te sientes ahora mismo?' : 'How are you feeling right now?'}
            </Text>
          </View>

          {/* Emotion Categories */}
          <View style={styles.emotionsSection}>
            {Object.entries(emotionCategories).map(([key, category]) => 
              renderCategory(key, category)
            )}
          </View>

          {/* Writing Section */}
          <View style={styles.writingSection}>
            <Text style={styles.writingPrompt}>
              {language === 'es' 
                ? '¿Quieres contarnos un poco más sobre tu día?' 
                : 'Would you like to tell us a bit more about your day?'}
            </Text>
            
            <View style={styles.writingCard}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder={language === 'es' ? 'Escribe lo que sientes...' : 'Write what you feel...'}
                placeholderTextColor={colors.textLight}
                value={texto}
                onChangeText={setTexto}
                textAlignVertical="top"
              />
              
              {/* Want to Talk Button */}
              <TouchableOpacity 
                style={styles.wantToTalkButton}
                onPress={goToChat}
                activeOpacity={0.8}
              >
                <Ionicons name="leaf-outline" size={18} color={colors.softWhite} />
                <Text style={styles.wantToTalkText}>
                  {language === 'es' ? '¿Quieres hablar?' : 'Want to talk?'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Info */}
          {weather && (
            <View style={styles.weatherInfo}>
              <Ionicons name="partly-sunny-outline" size={16} color={colors.textOnDark} />
              <Text style={styles.weatherText}>
                {Math.round(weather.temperature)}°C • {weather.condition}
              </Text>
            </View>
          )}

          {/* Accompaniment Phrase */}
          <Text style={styles.accompanimentPhrase}>
            {language === 'es' 
              ? 'Estoy contigo, incluso en los días en los que no puedes con todo.'
              : "I'm with you, even on the days when you can't handle everything."}
          </Text>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossGreen,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  
  // Emotional Header
  emotionalHeader: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  emotionalTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emotionalSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Emotions Section
  emotionsSection: {
    marginBottom: spacing.lg,
  },
  categoryContainer: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textOnDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  emotionBubblesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emotionBubbleContainer: {
    marginBottom: spacing.xs,
  },
  emotionBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionBubbleActive: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  emotionBubbleText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
  },
  emotionValueBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  emotionValueText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  emotionExpanded: {
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  emotionExpandedContent: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emotionQuestion: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Slider
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sliderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  
  // Intensity Selector
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamLight,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
  },
  
  // Writing Section
  writingSection: {
    marginBottom: spacing.lg,
  },
  writingPrompt: {
    fontSize: typography.sizes.md,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
    marginBottom: spacing.md,
  },
  writingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  textInput: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    minHeight: 140,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  wantToTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mossGreen,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  wantToTalkText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.softWhite,
  },
  
  // Weather
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  weatherText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    opacity: 0.8,
  },
  
  // Accompaniment Phrase
  accompanimentPhrase: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.warmBrown,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
    opacity: 0.9,
  },
});
