import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { sendChatMessage, getChatHistory, clearChatHistory, getConversationMessages, ChatMessage } from '../../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const { deviceId, language } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(params.conversationId);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (params.conversationId) {
      setCurrentConversationId(params.conversationId);
      loadConversation(params.conversationId);
    } else {
      loadHistory();
    }
  }, [deviceId, params.conversationId]);

  const loadConversation = async (conversationId: string) => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const history = await getConversationMessages(deviceId, conversationId);
      if (history.length === 0) {
        setMessages([{
          role: 'assistant',
          content: t('agoraIntro'),
          created_at: new Date().toISOString(),
        }]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([{
        role: 'assistant',
        content: t('agoraIntro'),
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const history = await getChatHistory(deviceId);
      if (history.length === 0) {
        setMessages([{
          role: 'assistant',
          content: t('agoraIntro'),
          created_at: new Date().toISOString(),
        }]);
        setCurrentConversationId(undefined);
      } else {
        setMessages(history);
        // Get conversation_id from first message if available
        if (history[0]?.conversation_id) {
          setCurrentConversationId(history[0].conversation_id);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: 'assistant',
        content: t('agoraIntro'),
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    // Simply reset to a new conversation
    setCurrentConversationId(undefined);
    setMessages([{
      role: 'assistant',
      content: t('agoraIntro'),
      created_at: new Date().toISOString(),
    }]);
  };

  const handleViewHistory = () => {
    router.push('/conversations');
  };

  const handleSend = async () => {
    if (!inputText.trim() || !deviceId || sending) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSending(true);
    
    try {
      const response = await sendChatMessage(deviceId, userMessage.content, language, currentConversationId);
      
      if (response.requires_subscription) {
        router.push('/subscription');
        return;
      }
      
      // Update the conversation ID if this was a new conversation
      if (response.conversation_id && !currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: language === 'es' 
          ? 'Lo siento, ha ocurrido un error. ¿Puedes intentarlo de nuevo?' 
          : 'Sorry, something went wrong. Can you try again?',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="leaf" size={18} color={colors.mossGreen} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
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
      {/* Custom Header with New Chat and History Buttons */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.historyButton} 
          onPress={handleViewHistory}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={24} color={colors.softWhite} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="leaf" size={20} color={colors.softWhite} />
          <Text style={styles.headerTitle}>{t('chatWithAgora')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.softWhite} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.created_at}-${index}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      
        {sending && (
          <View style={styles.typingIndicator}>
            <Ionicons name="leaf" size={14} color={colors.mossGreenLight} />
            <Text style={styles.typingText}>{t('agoraTyping')}</Text>
          </View>
        )}
      
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('typeMessage')}
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() && !sending ? colors.softWhite : colors.textLight} 
          />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.mossGreen,
    borderBottomWidth: 1,
    borderBottomColor: colors.mossGreenLight,
  },
  historyButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: 'Cormorant_600SemiBold',
    color: colors.textOnDark,
  },
  newChatButton: {
    padding: spacing.xs,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.warmBrown,
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
    fontFamily: 'Nunito_400Regular',
  },
  userMessageText: {
    color: colors.softWhite,
  },
  assistantMessageText: {
    color: colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  typingText: {
    fontSize: typography.sizes.sm,
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnDark,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    backgroundColor: colors.mossGreenDark,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    fontFamily: 'Nunito_400Regular',
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warmBrown,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mossGreenLight,
  },
});
