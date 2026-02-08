import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getDiaryEntries, DiaryEntry } from '../../src/services/api';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language } = useStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    if (!deviceId) return;
    try {
      const data = await getDiaryEntries(deviceId);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [deviceId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
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

  const getTopEmotions = (emotional_state: any) => {
    return Object.entries(emotional_state)
      .filter(([_, value]) => (value as number) > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3);
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

  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const topEmotions = getTopEmotions(item.emotional_state);
    const dateLocale = language === 'es' ? es : enUS;
    
    return (
      <View style={styles.entryCard}>
        <Text style={styles.entryDate}>
          {format(new Date(item.created_at), "EEEE, d 'de' MMMM", { locale: dateLocale })}
        </Text>
        
        {item.texto && (
          <Text style={styles.entryText} numberOfLines={3}>
            {item.texto}
          </Text>
        )}
        
        <View style={styles.emotionsRow}>
          {topEmotions.map(([key, value]) => (
            <View 
              key={key} 
              style={[styles.emotionTag, { backgroundColor: getEmotionColor(key) }]}
            >
              <Text style={styles.emotionTagText}>
                {getEmotionLabel(key)} ({value as number})
              </Text>
            </View>
          ))}
        </View>
        
        {item.physical_state && (
          <View style={styles.physicalRow}>
            <Text style={styles.physicalText}>
              {t('nivel_dolor')}: {item.physical_state.nivel_dolor}/10
            </Text>
            <Text style={styles.physicalText}>
              {t('energia')}: {item.physical_state.energia}/10
            </Text>
          </View>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="book-outline" size={48} color={colors.mossGreen} />
      </View>
      <Text style={styles.emptyTitle}>{t('noEntries')}</Text>
      <Text style={styles.emptySubtitle}>{t('startWriting')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.softWhite}
            colors={[colors.warmBrown]}
          />
        }
        ListEmptyComponent={!loading ? EmptyState : null}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/diary/new')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.softWhite} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossGreen,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  entryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  entryDate: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.warmBrown,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  entryText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  emotionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  emotionTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  emotionTagText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_500Medium',
    color: colors.softWhite,
  },
  physicalRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  physicalText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    textAlign: 'center',
    opacity: 0.8,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.warmBrown,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
