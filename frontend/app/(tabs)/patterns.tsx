import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getPatterns, Patterns } from '../../src/services/api';

export default function PatternsScreen() {
  const { t } = useTranslation();
  const { deviceId } = useStore();
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatterns = async () => {
    if (!deviceId) return;
    try {
      const data = await getPatterns(deviceId, 7);
      if (data.patterns !== null) {
        setPatterns(data as Patterns);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, [deviceId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatterns();
    setRefreshing(false);
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

  const getEmotionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      calma: t('calma'),
      fatiga: t('fatiga'),
      niebla_mental: t('niebla_mental'),
      dolor_difuso: t('dolor_difuso'),
      gratitud: t('gratitud'),
      tension: t('tension'),
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!patterns || patterns.total_entries === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={64} color={colors.primaryLight} />
        <Text style={styles.emptyTitle}>{t('noPatterns')}</Text>
        <Text style={styles.emptySubtitle}>{t('keepWriting')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          {`últimos ${patterns.period_days} días`}
        </Text>
        <Text style={styles.summaryValue}>
          {patterns.total_entries} {patterns.total_entries === 1 ? 'entrada' : 'entradas'}
        </Text>
      </View>

      {/* Emotional Trends */}
      <Text style={styles.sectionTitle}>{t('emotionalTrends')}</Text>
      <View style={styles.card}>
        {Object.entries(patterns.emotional_averages).map(([key, value]) => (
          <View key={key} style={styles.trendRow}>
            <View style={styles.trendLabel}>
              <View style={[styles.trendDot, { backgroundColor: getEmotionColor(key) }]} />
              <Text style={styles.trendText}>{getEmotionLabel(key)}</Text>
            </View>
            <View style={styles.trendBarContainer}>
              <View 
                style={[
                  styles.trendBar, 
                  { 
                    width: `${(value / 5) * 100}%`,
                    backgroundColor: getEmotionColor(key)
                  }
                ]} 
              />
            </View>
            <Text style={styles.trendValue}>{value}/5</Text>
          </View>
        ))}
      </View>

      {/* Physical Trends */}
      {patterns.physical_averages && (
        <>
          <Text style={styles.sectionTitle}>{t('physicalTrends')}</Text>
          <View style={styles.card}>
            <View style={styles.physicalRow}>
              <View style={styles.physicalItem}>
                <Text style={styles.physicalLabel}>{t('nivel_dolor')}</Text>
                <Text style={styles.physicalValue}>{patterns.physical_averages.nivel_dolor}/10</Text>
              </View>
              <View style={styles.physicalItem}>
                <Text style={styles.physicalLabel}>{t('energia')}</Text>
                <Text style={styles.physicalValue}>{patterns.physical_averages.energia}/10</Text>
              </View>
              <View style={styles.physicalItem}>
                <Text style={styles.physicalLabel}>{t('sensibilidad')}</Text>
                <Text style={styles.physicalValue}>{patterns.physical_averages.sensibilidad}/10</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Common Words */}
      {patterns.common_words && patterns.common_words.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('commonWords')}</Text>
          <View style={styles.card}>
            <View style={styles.wordsContainer}>
              {patterns.common_words.map(([word, count], index) => (
                <View key={index} style={styles.wordTag}>
                  <Text style={styles.wordText}>{word}</Text>
                  <Text style={styles.wordCount}>({count})</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Insight */}
      <View style={styles.insightCard}>
        <Ionicons name="bulb-outline" size={24} color={colors.accent} />
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>
            {patterns.language === 'es' ? 'Patrón destacado' : 'Notable pattern'}
          </Text>
          <Text style={styles.insightText}>
            {t('language') === 'es'
              ? `Tu estado más frecuente ha sido "${getEmotionLabel(patterns.trends.highest_emotional)}". Recuerda que cada día es único.`
              : `Your most frequent state has been "${getEmotionLabel(patterns.trends.highest_emotional)}". Remember that every day is unique.`
            }
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: typography.sizes.sm,
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  summaryValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trendLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  trendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  trendText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  trendBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
  },
  trendBar: {
    height: 8,
    borderRadius: 4,
  },
  trendValue: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  physicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  physicalItem: {
    alignItems: 'center',
  },
  physicalLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  physicalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  wordText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  wordCount: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.accentLight,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
