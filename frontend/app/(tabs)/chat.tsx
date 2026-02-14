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
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { sendChatMessage } from '../../src/services/api';

const colors = {
  mossGreen: '#6B8E6F',
  mossGreenDark: '#4a4238',
  mossGreenLight: '#8AA48F',
  cream: '#FDFBF9',
  text: '#333333',
  lightText: '#888888',
  gold: '#C9A876',
  dustyRose: '#9B7A6B',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola. Soy Ágora, tu compañera en este camino. Sé que hay días difíciles y otros un poco mejores. ¿Cómo estás hoy?',
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const deviceId = 'test-device-' + Math.random().toString(36).substr(2, 9);
  
  // Get API URL from constants
  const getApiUrl = () => {
    const extraUrl = Constants.expoConfig?.extra?.EXPO_BACKEND_URL;
    if (extraUrl) {
      console.log('[Chat] Using backend URL:', extraUrl);
      return extraUrl;
    }
    console.log('[Chat] Using fallback localhost URL');
    return 'http://localhost:8001';
  };
  
  const apiUrl = getApiUrl();

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(userMessage, conversationId, deviceId); // Se agregaron los argumentos faltantes
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Error'
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={[styles.typingDot, styles.dot1]} />
      <View style={[styles.typingDot, styles.dot2]} />
      <View style={[styles.typingDot, styles.dot3]} />
    </View>
  );

  const router = useRouter();

  const startNewConversation = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hola. Soy Ágora, tu compañera en este camino. Sé que hay días difíciles y otros un poco mejores. ¿Cómo estás hoy?',
    }]);
    setConversationId('');
  };

  const handleCrisis = () => {
    router.push('/crisis');
  };

  const handleHistory = () => {
    router.push('/conversations');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con logo y botones */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="leaf" size={24} color={colors.cream} />
          <Text style={styles.headerTitle}>Conversa con Ágora</Text>
        </View>
        <View style={styles.headerButtons}>
          {/* Botón de emergencia */}
          <TouchableOpacity style={styles.emergencyBtn} onPress={handleCrisis}>
            <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
          </TouchableOpacity>
          {/* Botón de historial */}
          <TouchableOpacity style={styles.headerBtn} onPress={handleHistory}>
            <Ionicons name="time-outline" size={22} color={colors.cream} />
          </TouchableOpacity>
          {/* Botón de nuevo chat */}
          <TouchableOpacity style={styles.headerBtn} onPress={startNewConversation}>
            <Ionicons name="add-circle-outline" size={22} color={colors.cream} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <View>
            <View style={[styles.messageBubble, item.role === 'user' ? styles.userMsg : styles.agoraMsg]}>
              {item.role === 'assistant' && (
                <View style={styles.agoraAvatar}>
                  <MaterialCommunityIcons name="leaf" size={16} color={colors.mossGreen} />
                </View>
              )}
              <Text style={[styles.text, item.role === 'user' ? styles.userText : styles.agoraText]}>
                {item.content}
              </Text>
            </View>
            {/* Botones de reacción para mensajes de Ágora */}
            {item.role === 'assistant' && (
              <View style={styles.reactionButtons}>
                <TouchableOpacity style={styles.reactionBtn}>
                  <Text style={styles.reactionEmoji}>🔥</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionBtn}>
                  <Text style={styles.reactionEmoji}>💜</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reactionBtn}>
                  <Text style={styles.reactionEmoji}>🚀</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
      />

      {loading && (
        <View style={styles.typingSection}>
          <View style={styles.agoraAvatar}>
            <MaterialCommunityIcons name="leaf" size={16} color={colors.mossGreen} />
          </View>
          <TypingIndicator />
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Escribe lo que sientes..."
              placeholderTextColor={colors.lightText}
              value={input}
              onChangeText={setInput}
              multiline
              editable={!loading}
              maxLength={500}
            />
            <Text style={styles.charCount}>{input.length}/500</Text>
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cream} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.cream} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mossGreenDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.mossGreenDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.mossGreen,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.lightText,
    fontWeight: '400',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  emergencyBtn: {
    padding: 6,
  },
  reactionButtons: {
    flexDirection: 'row',
    marginLeft: 36,
    marginTop: 4,
    marginBottom: 8,
    gap: 8,
  },
  reactionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageBubble: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMsg: {
    justifyContent: 'flex-end',
  },
  agoraMsg: {
    justifyContent: 'flex-start',
  },
  agoraAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  text: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    backgroundColor: '#C9976B',
    color: colors.cream,
    marginRight: 8,
    borderBottomRightRadius: 4,
  },
  agoraText: {
    backgroundColor: colors.cream,
    color: colors.text,
    borderBottomLeftRadius: 4,
  },
  typingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightText,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputArea: {
    backgroundColor: colors.mossGreenDark,
    borderTopWidth: 1,
    borderTopColor: colors.mossGreen,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 10,
  },
  charCount: {
    fontSize: 10,
    color: colors.lightText,
    textAlign: 'right',
    marginBottom: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mossGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
