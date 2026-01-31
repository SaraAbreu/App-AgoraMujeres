import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getResources, getResourceCategories, Resource, ResourceCategory } from '../../src/services/api';

const CATEGORY_ICONS: Record<string, string> = {
  breathing: 'leaf-outline',
  stretching: 'body-outline',
  nutrition: 'nutrition-outline',
  sleep: 'moon-outline',
  mindfulness: 'flower-outline',
  professional: 'medkit-outline',
};

export default function ResourcesScreen() {
  const router = useRouter();
  const { language } = useStore();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [language])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [resourcesData, categoriesData] = await Promise.all([
        getResources(selectedCategory || undefined, language),
        getResourceCategories(language)
      ]);
      setResources(resourcesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      const data = await getResources(categoryId || undefined, language);
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourcePress = (resource: Resource) => {
    if (resource.type === 'video' && resource.video_url) {
      Linking.openURL(resource.video_url);
    } else {
      router.push({
        pathname: '/resources/detail',
        params: { resourceId: resource.id }
      });
    }
  };

  const renderCategory = ({ item }: { item: ResourceCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipSelected
      ]}
      onPress={() => handleCategorySelect(selectedCategory === item.id ? null : item.id)}
    >
      <Ionicons 
        name={(CATEGORY_ICONS[item.id] || 'document-outline') as any} 
        size={16} 
        color={selectedCategory === item.id ? colors.softWhite : colors.mossGreen} 
      />
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item.id && styles.categoryChipTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderResource = ({ item }: { item: Resource }) => (
    <TouchableOpacity
      style={styles.resourceCard}
      onPress={() => handleResourcePress(item)}
      activeOpacity={0.8}
    >
      {item.thumbnail_url && (
        <Image 
          source={{ uri: item.thumbnail_url }} 
          style={styles.resourceImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={[styles.typeBadge, item.type === 'video' ? styles.videoBadge : styles.articleBadge]}>
            <Ionicons 
              name={item.type === 'video' ? 'play-circle' : 'document-text'} 
              size={12} 
              color={colors.softWhite} 
            />
            <Text style={styles.typeBadgeText}>
              {item.type === 'video' 
                ? (language === 'es' ? 'Vídeo' : 'Video')
                : (language === 'es' ? 'Artículo' : 'Article')}
            </Text>
          </View>
          {item.duration && (
            <Text style={styles.duration}>{item.duration}</Text>
          )}
          {item.read_time && (
            <Text style={styles.duration}>{item.read_time}</Text>
          )}
        </View>
        <Text style={styles.resourceTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resourceDescription} numberOfLines={2}>{item.description}</Text>
        {item.author && (
          <View style={styles.authorContainer}>
            <Ionicons name="person-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.authorName}>{item.author}</Text>
          </View>
        )}
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={colors.warmBrown} />
            <Text style={styles.featuredText}>
              {language === 'es' ? 'Destacado' : 'Featured'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && resources.length === 0) {
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
          {language === 'es' ? 'Recursos' : 'Resources'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {language === 'es' 
          ? 'Contenido de profesionales para tu bienestar'
          : 'Professional content for your wellbeing'}
      </Text>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color={colors.mossGreenLight} />
          <Text style={styles.emptyText}>
            {language === 'es' 
              ? 'No hay recursos disponibles en esta categoría'
              : 'No resources available in this category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resourcesList}
          showsVerticalScrollIndicator={false}
        />
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
    fontSize: typography.sizes.xl,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
  },
  placeholder: {
    width: 32,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.mossGreenLight,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  categoriesContainer: {
    marginBottom: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.mossGreenDark,
  },
  categoryChipText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_500Medium',
    color: colors.mossGreen,
  },
  categoryChipTextSelected: {
    color: colors.softWhite,
  },
  resourcesList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resourceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  resourceImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.creamLight,
  },
  resourceContent: {
    padding: spacing.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  videoBadge: {
    backgroundColor: colors.warmBrown,
  },
  articleBadge: {
    backgroundColor: colors.mossGreen,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.softWhite,
  },
  duration: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
  },
  resourceTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resourceDescription: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_500Medium',
    color: colors.textSecondary,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  featuredText: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.warmBrown,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.mossGreenLight,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
