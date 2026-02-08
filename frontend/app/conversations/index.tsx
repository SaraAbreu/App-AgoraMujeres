import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { getConversations, deleteConversation, Conversation } from '../../src/services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function ConversationsScreen() {
  const router = useRouter();
  const { deviceId, language } = useStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [deviceId])
  );

  const loadConversations = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await getConversations(deviceId);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    router.push({
      pathname: '/(tabs)/chat',
      params: { conversationId }
    });
  };

  const handleDeleteConversation = (conversationId: string, title: string) => {
    const alertTitle = language === 'es' ? 'Eliminar conversación' : 'Delete conversation';
    const alertMessage = language === 'es' 
      ? `¿Seguro que quieres eliminar "${title}"?`
      : `Are you sure you want to delete "${title}"?`;
    const cancel = language === 'es' ? 'Cancelar' : 'Cancel';
    const confirm = language === 'es' ? 'Eliminar' : 'Delete';

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: cancel, style: 'cancel' },
        {
          text: confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(deviceId!, conversationId);
              loadConversations();
            } catch (error) {
              console.error('Error deleting conversation:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'es' ? es : enUS;
    
    if (isToday(date)) {
      return language === 'es' ? 'Hoy' : 'Today';
    }
    if (isYesterday(date)) {
      return language === 'es' ? 'Ayer' : 'Yesterday';
    }
    return format(date, 'd MMM', { locale });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleSelectConversation(item.id)}
      onLongPress={() => handleDeleteConversation(item.id, item.title)}
      activeOpacity={0.8}
    >
      <View style={styles.conversationIcon}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.mossGreen} />
      </View>
      <View style={styles.conversationContent}>
        <Text style={styles.conversationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.conversationDate}>
          {formatDate(item.updated_at)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

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
          {language === 'es' ? 'Mis conversaciones' : 'My conversations'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.mossGreenLight} />
          <Text style={styles.emptyText}>
            {language === 'es' 
              ? 'Aún no tienes conversaciones.\nEmpieza una nueva con Ágora.'
              : 'You don\'t have any conversations yet.\nStart a new one with Ágora.'}
          </Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.newChatButtonText}>
              {language === 'es' ? 'Nueva conversación' : 'New conversation'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.hint}>
            {language === 'es' 
              ? 'Mantén pulsado para eliminar'
              : 'Long press to delete'}
          </Text>
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  placeholder: {
    width: 32,
  },
  hint: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.mossGreenLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.creamLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_500Medium',
    color: colors.text,
    marginBottom: 2,
  },
  conversationDate: {
    fontSize: typography.sizes.xs,
    fontFamily: 'Nunito_400Regular',
    color: colors.textSecondary,
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
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  newChatButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  newChatButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_600SemiBold',
    color: colors.mossGreen,
  },
});
