import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { useStore } from '../store/useStore';

interface PaywallModalProps {
  visible: boolean;
  onClose?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { language } = useStore();

  const handleSubscribe = () => {
    onClose?.();
    router.push('/subscription');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button - only if onClose provided */}
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={48} color={colors.warmBrown} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {language === 'es' 
              ? 'Tu prueba ha terminado' 
              : 'Your trial has ended'}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {language === 'es'
              ? 'Gracias por probar Ágora Mujeres. Para seguir disfrutando de tu compañera emocional, activa tu suscripción.'
              : 'Thank you for trying Ágora Mujeres. To continue enjoying your emotional companion, activate your subscription.'}
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mossGreen} />
              <Text style={styles.featureText}>
                {language === 'es' ? 'Diario emocional ilimitado' : 'Unlimited emotional diary'}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mossGreen} />
              <Text style={styles.featureText}>
                {language === 'es' ? 'Chat con Ágora sin límites' : 'Unlimited chat with Ágora'}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mossGreen} />
              <Text style={styles.featureText}>
                {language === 'es' ? 'Análisis de patrones' : 'Pattern analysis'}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.mossGreen} />
              <Text style={styles.featureText}>
                {language === 'es' ? 'Registro mensual de dolor' : 'Monthly pain record'}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>10€</Text>
            <Text style={styles.priceUnit}>/{language === 'es' ? 'mes' : 'month'}</Text>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>
              {language === 'es' ? 'Activar suscripción' : 'Activate subscription'}
            </Text>
          </TouchableOpacity>

          {/* Secondary text */}
          <Text style={styles.secondaryText}>
            {language === 'es'
              ? 'Cancela cuando quieras'
              : 'Cancel anytime'}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  features: {
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: 40,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
  },
  priceUnit: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  subscribeButton: {
    backgroundColor: colors.mossGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscribeButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  secondaryText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textLight,
  },
});
