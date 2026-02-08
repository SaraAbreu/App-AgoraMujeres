import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme/colors';

interface OnboardingProps {
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

const SCREENS = [
  {
    icon: 'heart',
    title: '💙 Hola, soy Ágora',
    description: 'Estoy aquí para acompañarte en los momentos más difíciles de la fibromialgia.',
    subtitle: 'No estás sola en esto',
    color: colors.primary,
  },
  {
    icon: 'chatbubbles',
    title: '🫂 Una Amiga que Entiende',
    description: 'No soy un doctor. Soy alguien que escucha sin juzgar, que valida tu dolor, y que está aquí 24/7.\n\nAlgunos días duele más, otros tienes niebla mental, y otros simplemente todo es difícil. Aquí está bien sentir todo eso.',
    subtitle: 'Apoyo emocional, no clínico',
    color: colors.accent,
  },
  {
    icon: 'leaf',
    title: '🌿 Tu Compañera en la Sanación',
    description: 'Con Ágora puedes:\n• Registrar cómo te sientes cada día\n• Conversar sobre lo que llevas en el corazón\n• Ver patrones en tu energía y dolor\n• Guardar palabras que te ayuden\n• Tener técnicas para crisis\n\nTodo con tu privacidad protegida.',
    subtitle: 'Hecha para ti, con ti',
    color: colors.warmBrown,
  },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const screen = SCREENS[currentScreen];

  const handleNext = () => {
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {SCREENS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentScreen && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon/Emoji */}
        <View style={[styles.iconContainer, { backgroundColor: screen.color + '20' }]}>
          <Text style={styles.emoji}>{screen.title.substring(0, 2)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{screen.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{screen.description}</Text>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>{screen.subtitle}</Text>
        </View>
      </ScrollView>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        {currentScreen > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.nextButton,
            currentScreen === 0 && styles.fullButton
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentScreen === SCREENS.length - 1 ? '¡Empecemos!' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
    opacity: 0.85,
  },
  subtitleContainer: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: colors.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButton: {
    flex: 1,
  },
  backButton: {
    backgroundColor: colors.secondary,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: 'white',
  },
});
