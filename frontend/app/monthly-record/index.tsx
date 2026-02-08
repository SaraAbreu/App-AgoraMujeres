import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { format, differenceInDays, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { getMonthlyRecord, saveMonthlyRecord, MonthlyPainRecord } from '../../src/services/api';

// Configure calendar locale
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.locales['en'] = LocaleConfig.locales[''];

interface DayRecord {
  date: string;
  intensity: number; // 1-5
  notes?: string;
}

export default function MonthlyRecordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<Date>(new Date());
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  LocaleConfig.defaultLocale = language === 'es' ? 'es' : 'en';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [deviceId])
  );

  const loadData = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await getMonthlyRecord(deviceId);
      if (data) {
        setRecords(data.records || []);
        const startDate = new Date(data.cycle_start_date);
        setCycleStartDate(startDate);
        
        // Calculate days remaining
        const daysPassed = differenceInDays(new Date(), startDate);
        const remaining = Math.max(0, 30 - daysPassed);
        setDaysRemaining(remaining);
        
        // If cycle has ended, show message
        if (remaining === 0 && data.records.length > 0) {
          // Cycle ended - user needs to download or start new
        }
      }
    } catch (error) {
      console.error('Error loading monthly record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    setShowIntensityPicker(true);
  };

  const handleIntensitySelect = async (intensity: number) => {
    if (!selectedDate || !deviceId) return;
    
    try {
      const existingIndex = records.findIndex(r => r.date === selectedDate);
      let newRecords: DayRecord[];
      
      if (intensity === 0) {
        // Remove record
        newRecords = records.filter(r => r.date !== selectedDate);
      } else if (existingIndex >= 0) {
        // Update existing
        newRecords = [...records];
        newRecords[existingIndex] = { ...newRecords[existingIndex], intensity };
      } else {
        // Add new
        newRecords = [...records, { date: selectedDate, intensity }];
      }
      
      await saveMonthlyRecord(deviceId, {
        records: newRecords,
        cycle_start_date: cycleStartDate.toISOString(),
      });
      
      setRecords(newRecords);
    } catch (error) {
      console.error('Error saving record:', error);
    }
    
    setShowIntensityPicker(false);
    setSelectedDate(null);
  };

  const startNewCycle = async () => {
    if (!deviceId) return;
    
    Alert.alert(
      language === 'es' ? 'Nuevo ciclo' : 'New cycle',
      language === 'es' 
        ? '¿Quieres empezar un nuevo ciclo de 30 días? Los datos actuales se borrarán.'
        : 'Do you want to start a new 30-day cycle? Current data will be deleted.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Empezar' : 'Start',
          onPress: async () => {
            try {
              await saveMonthlyRecord(deviceId, {
                records: [],
                cycle_start_date: new Date().toISOString(),
              });
              setRecords([]);
              setCycleStartDate(new Date());
              setDaysRemaining(30);
            } catch (error) {
              console.error('Error starting new cycle:', error);
            }
          }
        }
      ]
    );
  };

  const generatePDF = async () => {
    if (records.length === 0) {
      Alert.alert(
        '',
        language === 'es' ? 'No hay registros para exportar' : 'No records to export'
      );
      return;
    }

    setGeneratingPdf(true);
    try {
      const dateLocale = language === 'es' ? es : enUS;
      const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
      
      const intensityLabels = {
        1: language === 'es' ? 'Muy leve' : 'Very mild',
        2: language === 'es' ? 'Leve' : 'Mild',
        3: language === 'es' ? 'Moderado' : 'Moderate',
        4: language === 'es' ? 'Intenso' : 'Intense',
        5: language === 'es' ? 'Muy intenso' : 'Very intense',
      };

      const rowsHtml = sortedRecords.map(record => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E8E0D8;">
            ${format(new Date(record.date), "EEEE, d 'de' MMMM", { locale: dateLocale })}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E8E0D8; text-align: center;">
            <span style="background-color: ${getIntensityColor(record.intensity)}; color: white; padding: 4px 12px; border-radius: 12px;">
              ${intensityLabels[record.intensity as keyof typeof intensityLabels]}
            </span>
          </td>
        </tr>
      `).join('');

      // Calculate statistics
      const avgIntensity = records.reduce((sum, r) => sum + r.intensity, 0) / records.length;
      const highPainDays = records.filter(r => r.intensity >= 4).length;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${language === 'es' ? 'Registro Mensual de Dolor' : 'Monthly Pain Record'}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #3D3628; }
            h1 { color: #B87333; font-size: 28px; margin-bottom: 8px; }
            h2 { color: #5D4E43; font-size: 18px; font-weight: normal; margin-bottom: 30px; }
            .header-info { background: #EDE8E3; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-box { background: #8A8C6C; color: white; padding: 20px; border-radius: 12px; flex: 1; text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; }
            .stat-label { font-size: 14px; opacity: 0.9; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #8A8C6C; color: white; padding: 12px; text-align: left; }
            .footer { margin-top: 40px; text-align: center; color: #8B7B6B; font-style: italic; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Ágora Mujeres</h1>
          <h2>${language === 'es' ? 'Registro Mensual de Dolor' : 'Monthly Pain Record'}</h2>
          
          <div class="header-info">
            <strong>${language === 'es' ? 'Período:' : 'Period:'}</strong> 
            ${format(cycleStartDate, "d 'de' MMMM, yyyy", { locale: dateLocale })} - 
            ${format(addDays(cycleStartDate, 30), "d 'de' MMMM, yyyy", { locale: dateLocale })}
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${records.length}</div>
              <div class="stat-label">${language === 'es' ? 'Días registrados' : 'Days recorded'}</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${avgIntensity.toFixed(1)}</div>
              <div class="stat-label">${language === 'es' ? 'Intensidad promedio' : 'Average intensity'}</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${highPainDays}</div>
              <div class="stat-label">${language === 'es' ? 'Días de dolor alto' : 'High pain days'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${language === 'es' ? 'Fecha' : 'Date'}</th>
                <th style="text-align: center;">${language === 'es' ? 'Intensidad' : 'Intensity'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            ${language === 'es' 
              ? 'Este registro puede ser útil para compartir con tu equipo médico.'
              : 'This record may be useful to share with your medical team.'}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: language === 'es' ? 'Compartir registro' : 'Share record',
        });
      } else {
        Alert.alert(
          '',
          language === 'es' ? 'PDF generado correctamente' : 'PDF generated successfully'
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        '',
        language === 'es' ? 'Error al generar el PDF' : 'Error generating PDF'
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getIntensityColor = (intensity: number): string => {
    const intensityColors: Record<number, string> = {
      1: '#A8D5BA', // Very mild - green
      2: '#D4B896', // Mild - tan
      3: '#D4956A', // Moderate - orange
      4: '#C9A587', // Intense - terracotta
      5: '#C08080', // Very intense - rose
    };
    return intensityColors[intensity] || colors.primary;
  };

  const getMarkedDates = () => {
    const marked: any = {};
    records.forEach(record => {
      marked[record.date] = {
        selected: true,
        selectedColor: getIntensityColor(record.intensity),
      };
    });
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.mossGreen,
      };
    }
    return marked;
  };

  const getCurrentIntensity = () => {
    if (!selectedDate) return 0;
    const record = records.find(r => r.date === selectedDate);
    return record?.intensity || 0;
  };

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
          {language === 'es' ? 'Registro mensual' : 'Monthly record'}
        </Text>
        <TouchableOpacity 
          onPress={generatePDF} 
          style={styles.pdfButton}
          disabled={generatingPdf}
        >
          {generatingPdf ? (
            <ActivityIndicator size="small" color={colors.softWhite} />
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.softWhite} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <Ionicons name="medical-outline" size={24} color={colors.warmBrown} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>
              {language === 'es' ? 'Tu registro para el médico' : 'Your record for the doctor'}
            </Text>
            <Text style={styles.instructionsText}>
              {language === 'es' 
                ? 'Registra los días de dolor durante este mes. Al final podrás descargarlo en PDF para compartir con tu equipo médico.'
                : 'Record your pain days during this month. At the end you can download it as PDF to share with your medical team.'}
            </Text>
          </View>
        </View>

        {/* Cycle Status */}
        <View style={styles.cycleCard}>
          <View style={styles.cycleInfo}>
            <Text style={styles.cycleLabel}>
              {language === 'es' ? 'Días restantes del ciclo' : 'Days remaining in cycle'}
            </Text>
            <Text style={styles.cycleDays}>{daysRemaining}</Text>
          </View>
          <TouchableOpacity 
            style={styles.newCycleButton}
            onPress={startNewCycle}
          >
            <Ionicons name="refresh" size={18} color={colors.mossGreen} />
            <Text style={styles.newCycleText}>
              {language === 'es' ? 'Nuevo ciclo' : 'New cycle'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
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

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>
            {language === 'es' ? 'Niveles de intensidad' : 'Intensity levels'}
          </Text>
          <View style={styles.legendItems}>
            {[1, 2, 3, 4, 5].map(level => (
              <View key={level} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getIntensityColor(level) }]} />
                <Text style={styles.legendText}>
                  {level === 1 && (language === 'es' ? 'Muy leve' : 'Very mild')}
                  {level === 2 && (language === 'es' ? 'Leve' : 'Mild')}
                  {level === 3 && (language === 'es' ? 'Moderado' : 'Moderate')}
                  {level === 4 && (language === 'es' ? 'Intenso' : 'Intense')}
                  {level === 5 && (language === 'es' ? 'Muy intenso' : 'Very intense')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Summary */}
        {records.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {language === 'es' ? 'Resumen del ciclo' : 'Cycle summary'}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>{records.length}</Text>
                <Text style={styles.summaryLabel}>
                  {language === 'es' ? 'Días registrados' : 'Days recorded'}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>
                  {(records.reduce((sum, r) => sum + r.intensity, 0) / records.length).toFixed(1)}
                </Text>
                <Text style={styles.summaryLabel}>
                  {language === 'es' ? 'Promedio' : 'Average'}
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>
                  {records.filter(r => r.intensity >= 4).length}
                </Text>
                <Text style={styles.summaryLabel}>
                  {language === 'es' ? 'Días altos' : 'High days'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Intensity Picker Modal */}
      {showIntensityPicker && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity 
            style={styles.pickerBackdrop} 
            onPress={() => setShowIntensityPicker(false)}
            activeOpacity={1}
          />
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>
              {language === 'es' ? '¿Cómo fue el dolor ese día?' : 'How was the pain that day?'}
            </Text>
            <Text style={styles.pickerDate}>
              {selectedDate && format(new Date(selectedDate), "d 'de' MMMM", { locale: language === 'es' ? es : enUS })}
            </Text>
            <View style={styles.intensityOptions}>
              {[1, 2, 3, 4, 5].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityOption,
                    { backgroundColor: getIntensityColor(level) },
                    getCurrentIntensity() === level && styles.intensityOptionSelected
                  ]}
                  onPress={() => handleIntensitySelect(level)}
                >
                  <Text style={styles.intensityOptionText}>
                    {level === 1 && (language === 'es' ? 'Muy leve' : 'Very mild')}
                    {level === 2 && (language === 'es' ? 'Leve' : 'Mild')}
                    {level === 3 && (language === 'es' ? 'Moderado' : 'Moderate')}
                    {level === 4 && (language === 'es' ? 'Intenso' : 'Intense')}
                    {level === 5 && (language === 'es' ? 'Muy intenso' : 'Very intense')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {getCurrentIntensity() > 0 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleIntensitySelect(0)}
              >
                <Text style={styles.removeButtonText}>
                  {language === 'es' ? 'Quitar registro' : 'Remove record'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
  pdfButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.warmBrown,
    marginBottom: spacing.xs,
  },
  instructionsText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cycleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  cycleInfo: {
    flex: 1,
  },
  cycleLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  cycleDays: {
    fontSize: typography.sizes.xxl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
  },
  newCycleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.creamLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  newCycleText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.mossGreen,
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
  legendCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  legendTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  legendItems: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  summaryTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pickerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pickerDate: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
  },
  intensityOptions: {
    gap: spacing.sm,
  },
  intensityOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  intensityOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  intensityOptionText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  removeButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.error,
  },
});
