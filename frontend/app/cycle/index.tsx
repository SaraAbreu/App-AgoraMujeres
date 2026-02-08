import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getCycleEntries, createCycleEntry, CycleEntry } from '../../src/services/api';
import { format, differenceInDays, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

// Configure calendar locale
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.locales['en'] = LocaleConfig.locales[''];

export default function CycleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [isAddingCycle, setIsAddingCycle] = useState(false);

  LocaleConfig.defaultLocale = language === 'es' ? 'es' : 'en';

  useFocusEffect(
    useCallback(() => {
      loadCycles();
    }, [deviceId])
  );

  const loadCycles = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await getCycleEntries(deviceId, 12);
      setCycles(data);
    } catch (error) {
      console.error('Error loading cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: any) => {
    if (!isAddingCycle) {
      setIsAddingCycle(true);
      setSelectedStartDate(day.dateString);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      if (day.dateString >= selectedStartDate) {
        setSelectedEndDate(day.dateString);
      } else {
        // Reset if selecting earlier date
        setSelectedStartDate(day.dateString);
        setSelectedEndDate(null);
      }
    } else {
      // Reset selection
      setIsAddingCycle(true);
      setSelectedStartDate(day.dateString);
      setSelectedEndDate(null);
    }
  };

  const handleSaveCycle = async () => {
    if (!deviceId || !selectedStartDate) return;
    
    try {
      await createCycleEntry({
        device_id: deviceId,
        start_date: new Date(selectedStartDate).toISOString(),
        end_date: selectedEndDate ? new Date(selectedEndDate).toISOString() : undefined,
      });
      
      Alert.alert(
        '',
        language === 'es' ? 'Ciclo guardado' : 'Cycle saved',
        [{ text: 'OK' }]
      );
      
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setIsAddingCycle(false);
      loadCycles();
    } catch (error) {
      console.error('Error saving cycle:', error);
      Alert.alert(
        '',
        language === 'es' ? 'Error al guardar' : 'Error saving'
      );
    }
  };

  const cancelAddCycle = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsAddingCycle(false);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    // Mark saved cycles
    cycles.forEach((cycle, index) => {
      const startDate = cycle.start_date.split('T')[0];
      const endDate = cycle.end_date ? cycle.end_date.split('T')[0] : startDate;
      const cycleColor = index === 0 ? colors.warmBrown : '#C9A587';
      
      // Mark the range
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const isStart = dateStr === startDate;
        const isEnd = dateStr === endDate;
        
        marked[dateStr] = {
          color: cycleColor,
          textColor: colors.softWhite,
          startingDay: isStart,
          endingDay: isEnd,
        };
        
        currentDate = addDays(currentDate, 1);
      }
    });
    
    // Mark current selection
    if (selectedStartDate) {
      marked[selectedStartDate] = {
        ...marked[selectedStartDate],
        color: colors.mossGreen,
        textColor: colors.softWhite,
        startingDay: true,
        endingDay: !selectedEndDate,
      };
      
      if (selectedEndDate) {
        let currentDate = addDays(new Date(selectedStartDate), 1);
        const end = new Date(selectedEndDate);
        
        while (currentDate <= end) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const isEnd = dateStr === selectedEndDate;
          
          marked[dateStr] = {
            color: colors.mossGreen,
            textColor: colors.softWhite,
            startingDay: false,
            endingDay: isEnd,
          };
          
          currentDate = addDays(currentDate, 1);
        }
      }
    }
    
    return marked;
  };

  const getLastCycleInfo = () => {
    if (cycles.length === 0) return null;
    const lastCycle = cycles[0];
    const startDate = new Date(lastCycle.start_date);
    const daysSince = differenceInDays(new Date(), startDate);
    return { startDate, daysSince };
  };

  const lastCycleInfo = getLastCycleInfo();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.softWhite} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Ciclo hormonal' : 'Hormonal cycle'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Cycle Info */}
        {lastCycleInfo && (
          <View style={styles.lastCycleCard}>
            <Ionicons name="calendar" size={24} color={colors.warmBrown} />
            <View style={styles.lastCycleContent}>
              <Text style={styles.lastCycleLabel}>
                {language === 'es' ? 'Desde tu último ciclo' : 'Since your last cycle'}
              </Text>
              <Text style={styles.lastCycleDays}>
                {lastCycleInfo.daysSince} {language === 'es' ? 'días' : 'days'}
              </Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.instructionsText}>
            {language === 'es' 
              ? 'Toca una fecha para marcar el inicio de tu período. Opcionalmente, toca otra fecha para marcar el final.'
              : 'Tap a date to mark the start of your period. Optionally, tap another date to mark the end.'}
          </Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType="period"
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.mossGreen,
              selectedDayTextColor: colors.softWhite,
              todayTextColor: colors.warmBrown,
              dayTextColor: colors.text,
              textDisabledColor: colors.textLight,
              arrowColor: colors.warmBrown,
              monthTextColor: colors.text,
              textDayFontFamily: 'Nunito_400Regular',
              textMonthFontFamily: 'Cormorant_600SemiBold',
              textDayHeaderFontFamily: 'Nunito_500Medium',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Selection Actions */}
        {isAddingCycle && selectedStartDate && (
          <View style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>
              {language === 'es' ? 'Nuevo ciclo' : 'New cycle'}
            </Text>
            <Text style={styles.selectionDates}>
              {format(new Date(selectedStartDate), "d 'de' MMMM", { locale: language === 'es' ? es : enUS })}
              {selectedEndDate && ` - ${format(new Date(selectedEndDate), "d 'de' MMMM", { locale: language === 'es' ? es : enUS })}`}
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelAddCycle}>
                <Text style={styles.cancelButtonText}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCycle}>
                <Text style={styles.saveButtonText}>
                  {language === 'es' ? 'Guardar' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cycle History */}
        {cycles.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>
              {language === 'es' ? 'Historial' : 'History'}
            </Text>
            {cycles.slice(0, 6).map((cycle, index) => (
              <View key={cycle.id} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: index === 0 ? colors.warmBrown : '#C9A587' }]} />
                <Text style={styles.historyText}>
                  {format(new Date(cycle.start_date), "d MMM yyyy", { locale: language === 'es' ? es : enUS })}
                  {cycle.end_date && (
                    <Text style={styles.historyEndDate}>
                      {' → '}{format(new Date(cycle.end_date), "d MMM", { locale: language === 'es' ? es : enUS })}
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossGreen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.mossGreen,
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastCycleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  lastCycleContent: {
    flex: 1,
  },
  lastCycleLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  lastCycleDays: {
    fontSize: typography.sizes.xxl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.creamLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  instructionsText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  calendar: {
    borderRadius: borderRadius.lg,
  },
  selectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  selectionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectionDates: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.warmBrown,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.creamLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.mossGreen,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  historySection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  historyTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    textTransform: 'capitalize',
  },
  historyEndDate: {
    color: colors.textSecondary,
  },
});
