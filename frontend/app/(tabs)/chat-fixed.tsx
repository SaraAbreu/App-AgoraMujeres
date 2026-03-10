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
  useColorScheme,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { sendChatMessage, saveMessageReaction, getMessageReactions } from '../../src/services/api';
import { useStore } from '../../src/store/useStore';

// Color scheme support for light and dark mode
const createColors = (isDark: boolean) => ({
  mossGreen: isDark ? '#6B8476' : '#7A9B82',
  mossGreenDark: isDark ? '#4A5E54' : '#5A7A63',
  mossGreenLight: isDark ? '#8FA799' : '#A3B8AB',
  cream: isDark ? '#2A2A2A' : '#FDFBF9',
  text: isDark ? '#E8E8E8' : '#3D3D3D',
  lightText: isDark ? '#A8A8A8' : '#8B8B8B',
  accentWarm: isDark ? '#C99563' : '#D4A574',
  accentSoft: isDark ? '#3E3B38' : '#E8D5C4',
  background: isDark ? '#1A1A1A' : '#F5F3F0',
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  exercises?: Exercise[];
}

interface Exercise {
  title: string;
  description: string;
  duration: string;
  difficulty: 'fácil' | 'moderado' | 'avanzado';
}

interface ExerciseFeedback {
  exerciseTitle: string;
  status: 'attempted' | 'skipped';
  messageId: string;
}

const INITIAL_MESSAGE = `Hola, soy Ágora 💚

Fui creada especialmente para ti - para acompañarte en tu experiencia con fibromialgia, dolor crónico y fatiga. Aquí no hay prisa, no hay juicio. 

💙 Entiendo que:
• Tu dolor es real y válido
• Algunos días son más difíciles que otros
• A veces ni tú misma entiendes qué te duele
• Necesitas sentirte escuchada

Soy tu espacio seguro. Cuéntame cómo te sientes hoy - qué duele, qué te agota, qué te preocupa. Y si lo considero útil, te ofreceré ejercicios gentiles adaptados a lo que compartiste.

✨ Aquí estoy por ti.`;

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = createColors(isDark);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: INITIAL_MESSAGE,
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [exerciseFeedback, setExerciseFeedback] = useState<ExerciseFeedback[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const flatListRef = useRef<FlatList<Message>>(null);
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
      const data = await sendChatMessage(userMessage, conversationId, deviceId);
      
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Error',
        exercises: data.exercises,
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

  useEffect(() => {
    const sendDiaryMessage = async () => {
      const { diaryMessageToPushToChat, setDiaryMessageToPushToChat } = useStore.getState();
      
      if (diaryMessageToPushToChat && diaryMessageToPushToChat.trim()) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'user', 
          content: diaryMessageToPushToChat 
        }]);
        
        setLoading(true);
        try {
          const data = await sendChatMessage(diaryMessageToPushToChat, conversationId, deviceId);
          
          if (data.conversation_id) {
            setConversationId(data.conversation_id);
          }
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || 'Error',
            exercises: data.exercises,
          }]);
        } catch (error) {
          console.error('Error sending diary message:', error);
        } finally {
          setLoading(false);
          setDiaryMessageToPushToChat(null);
        }
      }
    };
    
    sendDiaryMessage();
  }, []);

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
      content: INITIAL_MESSAGE,
    }]);
    setConversationId('');
  };

  const handleCrisis = () => {
    router.push('/crisis');
  };

  const handleHistory = () => {
    router.push('/conversations');
  };

  const handleExerciseFeedback = (messageId: string, exerciseTitle: string, status: 'attempted' | 'skipped') => {
    setExerciseFeedback(prev => [
      ...prev,
      { messageId, exerciseTitle, status }
    ]);
    
    const message = status === 'attempted' 
      ? `¡Qué bien! Empezaste "${exerciseTitle}" 💚` 
      : `Sin problema, puedes intentarlo en otro momento 🙏`;
    
    Alert.alert(
      status === 'attempted' ? '¡Bien hecho!' : 'De acuerdo',
      message,
      [{ text: 'Continuar', onPress: () => {} }]
    );
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    try {
      await saveMessageReaction(deviceId, conversationId, messageId, reaction);
      
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [reaction]: (prev[messageId]?.[reaction] || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error saving reaction:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.mossGreenDark, borderBottomColor: colors.mossGreen }]}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="leaf" size={24} color={colors.cream} />
            <View>
              <Text style={[styles.headerTitle, { color: colors.cream }]}>Conversa con Ágora</Text>
              <Text style={[styles.headerSubtitle, { color: colors.mossGreenLight }]}>Tu espacio seguro</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.emergencyBtn} onPress={handleCrisis}>
              <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleHistory}>
              <Ionicons name="time-outline" size={22} color={colors.cream} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={startNewConversation}>
              <Ionicons name="add-circle-outline" size={22} color={colors.cream} />
            </TouchableOpacity>
          </View>
        </View>

        <Image
          source={require('../../assets/images/agora-logo.png')}
          style={styles.logoWatermark}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View style={styles.messageSectionContainer}>
              <View>
                <View style={[styles.messageBubble, item.role === 'user' ? styles.userMsg : styles.agoraMsg]}>
                  {item.role === 'assistant' && (
                    <View style={[styles.agoraAvatar, { backgroundColor: colors.mossGreenLight }]}>
                      <MaterialCommunityIcons name="leaf" size={16} color={colors.mossGreen} />
                    </View>
                  )}
                  <Text style={[styles.text, item.role === 'user' ? { ...styles.userText, color: colors.cream, backgroundColor: colors.accentWarm } : { ...styles.agoraText, color: colors.text, backgroundColor: colors.cream }]}>
                    {item.content}
                  </Text>
                </View>
                
                {item.exercises && item.exercises.length > 0 && (
                  <View style={styles.exercisesContainer}>
                    <Text style={[styles.exercisesTitle, { color: colors.text }]}>💚 Ejercicios que podrían ayudarte:</Text>
                    {item.exercises.map((exercise: Exercise, idx: number) => (
                      <View key={idx} style={[styles.exerciseCard, { borderLeftColor: colors.mossGreen }]}>
                        <View style={styles.exerciseHeader}>
                          <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exercise.title}</Text>
                          <Text style={[styles.exerciseDifficulty, { 
                            backgroundColor: exercise.difficulty === 'fácil' ? '#C8E6C9' : 
                                           exercise.difficulty === 'moderado' ? '#FFE0B2' : '#FFCCBC'
                          }]}>
                            {exercise.difficulty}
                          </Text>
                        </View>
                        <Text style={[styles.exerciseDescription, { color: colors.text }]}>{exercise.description}</Text>
                        <Text style={[styles.exerciseDuration, { color: colors.lightText }]}>⏱️ {exercise.duration}</Text>
                        
                        <View style={styles.exerciseActionButtons}>
                          <TouchableOpacity 
                            style={styles.exerciseAttemptBtn}
                            onPress={() => handleExerciseFeedback(item.id, exercise.title, 'attempted')}
                          >
                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                            <Text style={styles.exerciseAttemptBtnText}>Lo intentaré</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.exerciseSkipBtn}
                            onPress={() => handleExerciseFeedback(item.id, exercise.title, 'skipped')}
                          >
                            <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                            <Text style={styles.exerciseSkipBtnText}>Saltear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {item.role === 'assistant' && (
                  <View style={styles.reactionButtons}>
                    <TouchableOpacity 
                      style={[styles.reactionBtn, { backgroundColor: colors.accentSoft }]}
                      onPress={() => handleReaction(item.id, '💜')}
                    >
                      <Text style={styles.reactionEmoji}>💜</Text>
                      {messageReactions[item.id]?.['💜'] ? (
                        <Text style={[styles.reactionCount, { color: colors.text }]}>{messageReactions[item.id]?.['💜']}</Text>
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.reactionBtn, { backgroundColor: colors.accentSoft }]}
                      onPress={() => handleReaction(item.id, '🙏')}
                    >
                      <Text style={styles.reactionEmoji}>🙏</Text>
                      {messageReactions[item.id]?.['🙏'] ? (
                        <Text style={[styles.reactionCount, { color: colors.text }]}>{messageReactions[item.id]?.['🙏']}</Text>
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.reactionBtn, { backgroundColor: colors.accentSoft }]}
                      onPress={() => handleReaction(item.id, '✨')}
                    >
                      <Text style={styles.reactionEmoji}>✨</Text>
                      {messageReactions[item.id]?.['✨'] ? (
                        <Text style={[styles.reactionCount, { color: colors.text }]}>{messageReactions[item.id]?.['✨']}</Text>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          scrollEnabled={true}
        />

        {loading && (
          <View style={styles.typingSection}>
            <View style={[styles.agoraAvatar, { backgroundColor: colors.mossGreenLight }]}>
              <MaterialCommunityIcons name="leaf" size={16} color={colors.mossGreen} />
            </View>
            <TypingIndicator />
          </View>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.inputArea, { backgroundColor: colors.mossGreenDark, borderTopColor: colors.mossGreen }]}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.cream }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Cuéntame cómo te sientes..."
                placeholderTextColor={colors.lightText}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!loading}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: colors.lightText }]}>{input.length}/500</Text>
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.mossGreenDark }, loading && styles.sendBtnDisabled]}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
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
    marginRight: 8,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  agoraText: {
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
    borderTopWidth: 1,
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
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    padding: 0,
    minHeight: 40,
  },
  charCount: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  exercisesContainer: {
    marginLeft: 36,
    marginTop: 12,
    marginBottom: 8,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  exerciseCard: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(200, 230, 201, 0.1)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  exerciseDifficulty: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  exerciseDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  exerciseDuration: {
    fontSize: 11,
    fontWeight: '500',
  },
  exerciseActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DDD4',
  },
  exerciseAttemptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F1F8F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 6,
  },
  exerciseAttemptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  exerciseSkipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    gap: 6,
  },
  exerciseSkipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  logoWatermark: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.08,
    top: '30%',
    left: '50%',
    marginLeft: -100,
    zIndex: -1,
  },
  messageSectionContainer: {
    paddingHorizontal: 8,
  },
});
