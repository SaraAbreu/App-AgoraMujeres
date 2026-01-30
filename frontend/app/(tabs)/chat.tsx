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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/theme/colors';
import { useStore } from '../../src/store/useStore';
import { sendChatMessage, getChatHistory, ChatMessage } from '../../src/services/api';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { deviceId, language } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, [deviceId]);

  const loadHistory = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const history = await getChatHistory(deviceId);
      if (history.length === 0) {
        // Add intro message
        setMessages([{
          role: 'assistant',
          content: t('auroraIntro'),
          created_at: new Date().toISOString(),
        }]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: 'assistant',
        content: t('auroraIntro'),
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
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
      const response = await sendChatMessage(deviceId, userMessage.content, language);
      
      if (response.requires_subscription) {
        // Show subscription prompt
        router.push('/subscription');
        return;
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
          : 'Sorry, an error occurred. Can you try again?',
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
            <Text style={styles.avatarText}>🌸</Text>
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.created_at}-${index}`}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      />
      
      {sending && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Aurora {language === 'es' ? 'está escribiendo...' : 'is typing...'}</Text>
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
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() && !sending ? colors.white : colors.textLight} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
