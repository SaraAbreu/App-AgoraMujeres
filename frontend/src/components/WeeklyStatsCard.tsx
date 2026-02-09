import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { getPatterns } from '../services/api';

interface WeeklyStatsCardProps {
  deviceId: string;
}

export function WeeklyStatsCard({ deviceId }: WeeklyStatsCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!deviceId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const patterns = await getPatterns(deviceId, 7);
        
        // Calculate good/difficult days based on emotional state
        // We estimate from available data
        if (patterns.total_entries > 0) {
          const avgEmotion = patterns.emotional_averages?.mood || 5;
          const goodDays = Math.ceil(patterns.total_entries * (avgEmotion > 6 ? 0.6 : avgEmotion > 4 ? 0.4 : 0.2));
          const difficultDays = Math.ceil(patterns.total_entries * (avgEmotion < 4 ? 0.8 : avgEmotion < 6 ? 0.4 : 0.1));
          const avgPain = (patterns.physical_averages?.nivel_dolor || 0).toFixed(1);
          const topEmotion = patterns.trends?.highest_emotional || 'Sin datos';

          setStats({
            entries: patterns.total_entries,
            goodDays,
            difficultDays,
            avgPain,
            topEmotion,
          });
        }
        setLoading(false);
      } catch (err) {
        console.log('Error loading stats:', err);
        setError('Error loading stats');
        setLoading(false);
      }
    };

    loadStats();
  }, [deviceId]);

  if (!deviceId || error) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.warmBrown} />
      </View>
    );
  }

  if (!stats || stats.entries === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          {t('keepWriting') || '¡Escribe entradas para ver tus patrones!'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bar-chart" size={20} color={colors.warmBrown} />
        <Text style={styles.title}>{t('weeklyStats') || 'Esta semana'}</Text>
      </View>

      <View style={styles.statsGrid}>
        {/* Good Days */}
        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <Ionicons name="sunny" size={18} color={colors.success} />
          </View>
          <Text style={styles.statLabel}>{t('goodDays') || 'Días buenos'}</Text>
          <Text style={styles.statValue}>{stats.goodDays}</Text>
        </View>

        {/* Difficult Days */}
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="cloud" size={18} color="#D4604D" />
          </View>
          <Text style={styles.statLabel}>{t('difficultDays') || 'Días difíciles'}</Text>
          <Text style={styles.statValue}>{stats.difficultDays}</Text>
        </View>

        {/* Average Pain */}
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: '#FFF4E8' }]}>
            <Ionicons name="pulse" size={18} color={colors.warmBrown} />
          </View>
          <Text style={styles.statLabel}>{t('averagePain') || 'Dolor promedio'}</Text>
          <Text style={styles.statValue}>{stats.avgPain}/10</Text>
        </View>

        {/* Top Emotion */}
        <View style={styles.statItem}>
          <View style={[styles.statIconBg, { backgroundColor: '#E8F4FF' }]}>
            <Ionicons name="heart" size={18} color={colors.mossGreen} />
          </View>
          <Text style={styles.statLabel}>{t('topEmotion') || 'Emoción mayor'}</Text>
          <Text style={[styles.statValue, { fontSize: typography.sizes.sm }]}>
            {stats.topEmotion}
          </Text>
        </View>
      </View>

      <Text style={styles.encouragement}>
        {t('keepWriting') || 'Sigue escribiendo para descubrir tus patrones'}
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');
const itemWidth = (width - spacing.lg * 2 - spacing.sm * 3) / 4;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {
    width: itemWidth,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_700Bold',
    color: colors.warmBrown,
  },
  encouragement: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
