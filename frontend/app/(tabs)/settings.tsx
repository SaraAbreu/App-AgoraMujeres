import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { verifyAdminCode } from '../../src/services/api';
import i18n from '../../src/i18n';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, setLanguage, subscriptionStatus, deviceId, setSubscriptionStatus } = useStore();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const saved = localStorage?.getItem('notificationsEnabled');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [notificationHour, setNotificationHour] = useState(() => {
    try {
      const saved = localStorage?.getItem('notificationHour');
      return saved ? parseInt(saved) : 8;
    } catch {
      return 8;
    }
  });
  const [notificationMinute, setNotificationMinute] = useState(() => {
    try {
      const saved = localStorage?.getItem('notificationMinute');
      return saved ? parseInt(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [communityCount, setCommunityCount] = useState(0);

  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleNotificationToggle = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage?.setItem('notificationsEnabled', JSON.stringify(newState));
    if (newState) {
      localStorage?.setItem('notificationHour', String(notificationHour));
      localStorage?.setItem('notificationMinute', String(notificationMinute));
    }
  };

  const handleHourChange = (value: string) => {
    const hour = Math.max(0, Math.min(23, parseInt(value) || 0));
    setNotificationHour(hour);
    localStorage?.setItem('notificationHour', String(hour));
  };

  const handleMinuteChange = (value: string) => {
    const minute = Math.max(0, Math.min(59, parseInt(value) || 0));
    setNotificationMinute(minute);
    localStorage?.setItem('notificationMinute', String(minute));
  };

  // Load community count
  useEffect(() => {
    const loadCommunityCount = async () => {
      try {
        // Try to fetch from API
        if (typeof fetch !== 'undefined') {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'}/api/community/count`);
          if (response.ok) {
            const data = await response.json();
            setCommunityCount(data.community_size || 0);
          }
        }
      } catch (error) {
        console.log('Could not load community count:', error);
        // Set a default inspiring number if API fails
        setCommunityCount(Math.floor(Math.random() * 500) + 100);
      }
    };
    loadCommunityCount();
  }, []);

  const formatTrialTime = () => {
    if (isAdmin) return language === 'es' ? 'Ilimitado' : 'Unlimited';
    if (!subscriptionStatus?.trial_remaining_seconds) return '0h 0m';
    const hours = Math.floor(subscriptionStatus.trial_remaining_seconds / 3600);
    const minutes = Math.floor((subscriptionStatus.trial_remaining_seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleAdminCodeSubmit = async () => {
    if (!deviceId || !adminCode.trim()) return;
    
    try {
      const result = await verifyAdminCode(deviceId, adminCode.trim());
      if (result.success) {
        setIsAdmin(true);
        setSubscriptionStatus({ ...subscriptionStatus, status: 'active' });
        setShowAdminModal(false);
        setAdminCode('');
        Alert.alert(
          '✓',
          language === 'es' ? 'Acceso de administrador activado' : 'Admin access activated'
        );
      } else {
        Alert.alert(
          '',
          language === 'es' ? 'Código incorrecto' : 'Invalid code'
        );
      }
    } catch (error) {
      console.error('Error verifying admin code:', error);
      Alert.alert('Error', language === 'es' ? 'Error al verificar' : 'Verification error');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Admin Badge */}
      {isAdmin && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.warmBrown} />
          <Text style={styles.adminBadgeText}>
            {language === 'es' ? 'Modo Administrador' : 'Admin Mode'}
          </Text>
        </View>
      )}

      {/* Language Section */}
      <Text style={styles.sectionTitle}>{t('language')}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.optionRow,
            language === 'es' && styles.optionSelected
          ]}
          onPress={() => handleLanguageChange('es')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>🇪🇸 {t('spanish')}</Text>
          {language === 'es' && (
            <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
          )}
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[
            styles.optionRow,
            language === 'en' && styles.optionSelected
          ]}
          onPress={() => handleLanguageChange('en')}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>🇬🇧 {t('english')}</Text>
          {language === 'en' && (
            <Ionicons name="checkmark" size={20} color={colors.mossGreen} />
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <Text style={styles.sectionTitle}>
        {language === 'es' ? 'Notificaciones' : 'Notifications'}
      </Text>
      <View style={styles.card}>
        <View style={styles.notificationRow}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {language === 'es' 
                ? '¿Cómo amaneció tu cuerpo?' 
                : 'How did you wake up?'
              }
            </Text>
            <Text style={styles.notificationSubtitle}>
              {language === 'es' 
                ? 'Recordatorio diario' 
                : 'Daily reminder'
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.toggle, notificationsEnabled && styles.toggleActive]}
            onPress={handleNotificationToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {notificationsEnabled ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {notificationsEnabled && (
          <View style={styles.timePickerSection}>
            <Text style={styles.timeLabel}>
              {language === 'es' ? 'Hora de la notificación' : 'Notification time'}
            </Text>
            <View style={styles.timePicker}>
              <View style={styles.timeInputGroup}>
                <TextInput
                  style={styles.timeInput}
                  value={String(notificationHour).padStart(2, '0')}
                  onChangeText={handleHourChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={String(notificationMinute).padStart(2, '0')}
                  onChangeText={handleMinuteChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                />
              </View>
              <Text style={styles.timeExample}>
                {String(notificationHour).padStart(2, '0')}:{String(notificationMinute).padStart(2, '0')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Subscription Section */}
      <Text style={styles.sectionTitle}>{t('subscription')}</Text>
      <View style={styles.card}>
        {subscriptionStatus?.status === 'active' ? (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>{t('subscriptionActive')}</Text>
              <Text style={styles.statusSubtitle}>{t('priceMonthly')}</Text>
            </View>
          </View>
        ) : subscriptionStatus?.status === 'trial' ? (
          <View>
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={24} color={colors.warmBrown} />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{t('trialRemaining')}</Text>
                <Text style={styles.trialTime}>{formatTrialTime()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('/subscription')}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>{t('activateSubscription')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.statusRow}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{t('trialExpired')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('/subscription')}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>{t('activateSubscription')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Admin Code (hidden at bottom) */}
      <TouchableOpacity 
        style={styles.adminLink}
        onPress={() => setShowAdminModal(true)}
        activeOpacity={0.6}
      >
        <Text style={styles.adminLinkText}>
          {language === 'es' ? '¿Tienes un código de acceso?' : 'Have an access code?'}
        </Text>
      </TouchableOpacity>

      {/* Crisis Support Button */}
      <Text style={styles.sectionTitle}>
        {language === 'es' ? 'Emergencia' : 'Emergency'}
      </Text>
      <TouchableOpacity 
        style={styles.crisisButton}
        onPress={() => {
          alert('📞 ' + (language === 'es' ? 'Líneas de apoyo:' : 'Support lines:') + '\n\n🇪🇸 ' + (language === 'es' ? 'España:' : 'Spain:') + '\n- ' + (language === 'es' ? 'Teléfono de la Esperanza' : 'Telephone of Hope') + ': 717 003 717\n- ' + (language === 'es' ? 'Telediagnóstico' : 'Telediagnosis') + ': 971 439 500\n\n🇺🇸 International:\n- Crisis Text Line: Text HOME to 741741');
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="alert-circle" size={20} color={colors.softWhite} />
        <Text style={styles.crisisButtonText}>{t('needHelp')}</Text>
      </TouchableOpacity>

      {/* Community Section */}
      <Text style={styles.sectionTitle}>
        {language === 'es' ? 'Comunidad' : 'Community'}
      </Text>
      <View style={styles.card}>
        <View style={styles.communityRow}>
          <View style={styles.communityIconBg}>
            <Ionicons name="people" size={24} color={colors.mossGreen} />
          </View>
          <View style={styles.communityContent}>
            <Text style={styles.communityTitle}>
              {language === 'es' ? 'Juntas somos fuertes' : 'Together we are strong'}
            </Text>
            <Text style={styles.communityCount}>
              {communityCount > 0 ? communityCount : '...'}
            </Text>
            <Text style={styles.communitySubtitle}>
              {language === 'es' 
                ? `Mujeres en nuestra comunidad 💜` 
                : `Women in our community 💜`
              }
            </Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.appName}>Ágora Mujeres</Text>
        <Text style={styles.version}>v1.0.0</Text>
        <Text style={styles.tagline}>
          {language === 'es' 
            ? 'Tu refugio emocional' 
            : 'Your emotional refuge'
          }
        </Text>
      </View>

      {/* Admin Modal */}
      <Modal
        visible={showAdminModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowAdminModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Ionicons name="key-outline" size={40} color={colors.mossGreen} style={{ marginBottom: spacing.md }} />
            
            <Text style={styles.modalTitle}>
              {language === 'es' ? 'Código de administrador' : 'Admin code'}
            </Text>
            
            <TextInput
              style={styles.adminInput}
              value={adminCode}
              onChangeText={setAdminCode}
              placeholder={language === 'es' ? 'Introduce el código' : 'Enter code'}
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={styles.adminSubmitButton}
              onPress={handleAdminCodeSubmit}
            >
              <Text style={styles.adminSubmitText}>
                {language === 'es' ? 'Verificar' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#80704f',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textOnDark,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.creamLight,
  },
  optionText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  trialTime: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
    marginTop: spacing.xs,
  },
  subscribeButton: {
    backgroundColor: colors.mossGreen,
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  adminBadgeText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.warmBrown,
  },
  adminLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  adminLinkText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.mossGreenLight,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  adminInput: {
    backgroundColor: colors.creamLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  adminSubmitButton: {
    backgroundColor: colors.mossGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  adminSubmitText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
  },
  appName: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.textOnDark,
  },
  version: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  crisisButton: {
    backgroundColor: '#8B5A2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  crisisButtonText: {
    color: colors.softWhite,
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_700Bold',
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  communityIconBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
  },
  communityCount: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.mossGreen,
    marginTop: spacing.xs,
  },
  communitySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
  },
  notificationSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  toggleActive: {
    backgroundColor: colors.mossGreen,
    borderColor: colors.mossGreen,
  },
  toggleText: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Nunito_700Bold',
    color: colors.text,
  },
  timePickerSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  timeLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  timeInput: {
    flex: 1,
    backgroundColor: colors.creamLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: typography.sizes.lg,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    minHeight: 50,
  },
  timeSeparator: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
  },
  timeExample: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.mossGreen,
  },
});
