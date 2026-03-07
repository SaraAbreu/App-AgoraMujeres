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
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { sendChatMessage } from '../../src/services/api';

const colors = {
  // Paleta calmante y suave para acompañamiento emocional
  mossGreen: '#7A9B82',      // Verde musgo más suave
  mossGreenDark: '#5A7A63',  // Verde oscuro pero cálido
  mossGreenLight: '#A3B8AB', // Verde claro para acompañamiento
  cream: '#FDFBF9',          // Off-white cálido
  text: '#3D3D3D',           // Gris oscuro suave
  lightText: '#8B8B8B',      // Gris claro
  accentWarm: '#D4A574',     // Dorado cálido para usuario
  accentSoft: '#E8D5C4',     // Beige muy suave
  background: '#F5F3F0',     // Fondo muy cálido
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
      content: 'Hola, soy Ágora. Fui creada para mujeres como tú, que viven con fibromialgia - ese dolor que no tiene lógica, esa fatiga que deja sin respiración, esos días donde todo duele sin razón. Entiendo que nadie te cree del todo. Aquí sí. Sin preguntas. ¿Cómo estás hoy?',
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const [deviceId] = useState(() => `device-${Date.now()}`);
  const screenWidth = Dimensions.get('window').width;
  
  // Get API URL from constants
  const getApiUrl = () => {
    try {
      const extraUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
      if (extraUrl) {
        console.log('[Chat] Using backend URL:', extraUrl);
        return extraUrl;
      }
    } catch (e) {
      console.log('[Chat] Could not read expo config:', e);
    }
    console.log('[Chat] Using fallback localhost URL');
    return 'http://localhost:8000';
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
      content: 'Hola, soy Ágora. Fui creada para mujeres como tú, que viven con fibromialgia - ese dolor que no tiene lógica, esa fatiga que deja sin respiración, esos días donde todo duele sin razón. Entiendo que nadie te cree del todo. Aquí sí. Sin preguntas. ¿Cómo estás hoy?',
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
    backgroundColor: colors.background,
  },
  backgroundLogo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.03, // Muy tenue, casi imperceptible
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.mossGreenDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.mossGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.cream,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.lightText,
    fontWeight: '400',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emergencyBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  reactionButtons: {
    flexDirection: 'row',
    marginLeft: 36,
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  reactionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 18,
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  messageBubble: {
    marginVertical: 10,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mossGreenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  text: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    backgroundColor: colors.accentWarm,
    color: colors.cream,
    marginRight: 8,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  agoraText: {
    backgroundColor: colors.cream,
    color: colors.text,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  typingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 42,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mossGreenLight,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  inputArea: {
    backgroundColor: colors.mossGreenDark,
    borderTopWidth: 1,
    borderTopColor: colors.mossGreen,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 42,
    paddingVertical: 10,
    fontFamily: 'System',
  },
  charCount: {
    fontSize: 11,
    color: colors.lightText,
    textAlign: 'right',
    marginBottom: 2,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.mossGreenLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
