import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { createDiaryEntry, getWeather, EmotionalState, PhysicalState } from '../../src/services/api';
import * as Location from 'expo-location';

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
  const [showPhysical, setShowPhysical] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
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

  const handleEmotionChange = (key: keyof EmotionalState, value: number) => {
    setEmotionalState(prev => ({ ...prev, [key]: Math.round(value) }));
  };

  const handlePhysicalChange = (key: keyof PhysicalState, value: number) => {
    setPhysicalState(prev => ({ ...prev, [key]: Math.round(value) }));
  };

  const handleSave = async () => {
    if (!deviceId) return;
    
    setSaving(true);
    try {
      await createDiaryEntry({
        device_id: deviceId,
        texto: texto.trim() || undefined,
        emotional_state: emotionalState,
        physical_state: showPhysical ? physicalState : undefined,
        weather: weather || undefined,
      });
      
      Alert.alert(
        '',
        t('entrySaved'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert(t('error'), language === 'es' ? 'No se pudo guardar la entrada' : 'Could not save entry');
    } finally {
      setSaving(false);
    }
  };

  const goToChat = () => {
    router.replace('/(tabs)/chat');
  };

  const getEmotionColor = (key: string) => {
    const emotionColors: Record<string, string> = {
      calma: colors.emotion.calma,
      fatiga: colors.emotion.fatiga,
      niebla_mental: colors.emotion.niebla,
      dolor_difuso: colors.emotion.dolor,
      gratitud: colors.emotion.gratitud,
      tension: colors.emotion.tension,
    };
    return emotionColors[key] || colors.primary;
  };

  const EmotionSlider = ({ emotionKey, label }: { emotionKey: keyof EmotionalState; label: string }) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={[styles.emotionDot, { backgroundColor: getEmotionColor(emotionKey) }]} />
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{emotionalState[emotionKey]}/5</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={5}
        step={1}
        value={emotionalState[emotionKey]}
        onValueChange={(value) => handleEmotionChange(emotionKey, value)}
        minimumTrackTintColor={getEmotionColor(emotionKey)}
        maximumTrackTintColor={colors.border}
        thumbTintColor={getEmotionColor(emotionKey)}
      />
    </View>
  );

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
          <Text style={styles.title}>{t('newEntry')}</Text>
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
        >
          {/* Text Input Card */}
          <View style={styles.textCard}>
            <Text style={styles.textLabel}>{t('writeThoughts')}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder={language === 'es' ? 'Escribe aquí...' : 'Write here...'}
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
              <Text style={styles.wantToTalkText}>{t('wantToTalk')}</Text>
            </TouchableOpacity>
          </View>

          {/* Emotional State */}
          <Text style={styles.sectionTitle}>{t('howDoYouFeel')}</Text>
          <View style={styles.emotionsCard}>
            <EmotionSlider emotionKey="calma" label={t('calma')} />
            <EmotionSlider emotionKey="fatiga" label={t('fatiga')} />
            <EmotionSlider emotionKey="niebla_mental" label={t('niebla_mental')} />
            <EmotionSlider emotionKey="dolor_difuso" label={t('dolor_difuso')} />
            <EmotionSlider emotionKey="gratitud" label={t('gratitud')} />
            <EmotionSlider emotionKey="tension" label={t('tension')} />
          </View>

          {/* Physical State Toggle */}
          <TouchableOpacity 
            style={styles.physicalToggle}
            onPress={() => setShowPhysical(!showPhysical)}
            activeOpacity={0.8}
          >
            <View style={styles.physicalToggleContent}>
              <Ionicons 
                name={showPhysical ? "body" : "body-outline"} 
                size={20} 
                color={colors.mossGreen} 
              />
              <Text style={styles.physicalToggleText}>{t('physicalState')}</Text>
            </View>
            <Ionicons 
              name={showPhysical ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Physical State */}
          {showPhysical && (
            <Animated.View style={styles.physicalCard}>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>{t('nivel_dolor')}</Text>
                  <Text style={styles.sliderValue}>{physicalState.nivel_dolor}/10</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={physicalState.nivel_dolor}
                  onValueChange={(value) => handlePhysicalChange('nivel_dolor', value)}
                  minimumTrackTintColor={colors.emotion.dolor}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.emotion.dolor}
                />
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>{t('energia')}</Text>
                  <Text style={styles.sliderValue}>{physicalState.energia}/10</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={physicalState.energia}
                  onValueChange={(value) => handlePhysicalChange('energia', value)}
                  minimumTrackTintColor={colors.emotion.calma}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.emotion.calma}
                />
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>{t('sensibilidad')}</Text>
                  <Text style={styles.sliderValue}>{physicalState.sensibilidad}/10</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={physicalState.sensibilidad}
                  onValueChange={(value) => handlePhysicalChange('sensibilidad', value)}
                  minimumTrackTintColor={colors.emotion.niebla}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.emotion.niebla}
                />
              </View>
            </Animated.View>
          )}

          {/* Weather Info */}
          {weather && (
            <View style={styles.weatherInfo}>
              <Ionicons name="partly-sunny-outline" size={16} color={colors.textOnDark} />
              <Text style={styles.weatherText}>
                {Math.round(weather.temperature)}°C • {weather.condition}
              </Text>
            </View>
          )}
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
  title: {
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
    paddingBottom: spacing.xxl,
  },
  textCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  textLabel: {
    fontSize: typography.sizes.md,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  textInput: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    minHeight: 120,
    lineHeight: 26,
  },
  wantToTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mossGreen,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  wantToTalkText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.softWhite,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
    marginBottom: spacing.md,
  },
  emotionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  sliderLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  sliderValue: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.textSecondary,
  },
  slider: {
    height: 40,
    marginHorizontal: -spacing.sm,
  },
  physicalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  physicalToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  physicalToggleText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  physicalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  weatherText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    opacity: 0.8,
  },
});
