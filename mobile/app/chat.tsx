/**
 * Chat Screen - Real-time chat with matched traveler via Supabase Realtime
 */
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRequestsStore } from '@/stores/requestsStore';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedMatch } = useRequestsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!selectedMatch) {
      router.back();
    }
  }, [selectedMatch]);

  if (!selectedMatch) {
    return null;
  }

  const matchId = selectedMatch.id;
  const currentUserId = user?.id ?? 'current-user';
  const traveler = selectedMatch.traveler;

  // Check if chat is locked (24h after flight departure per ADR-008)
  const flightDate = new Date(selectedMatch.trip.departure_date);
  const lockTime = new Date(flightDate.getTime() + 24 * 60 * 60 * 1000);
  const isChatLocked = new Date() > lockTime;

  useEffect(() => {
    loadMessageHistory();
    const channel = subscribeToMessages();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const loadMessageHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data ?? []);
    }
    setLoadingHistory(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return channel;
  };

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || sending || isChatLocked) return;

    setSending(true);
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(content);
    }

    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text
            variant="bodyMedium"
            style={isMe ? styles.myMessageText : styles.theirMessageText}
          >
            {item.content}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}
          >
            {new Date(item.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const travelerInitials = traveler.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          {traveler.avatar_url ? (
            <Avatar.Image size={40} source={{ uri: traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={40} label={travelerInitials} />
          )}
          <View style={styles.headerInfo}>
            <Text variant="titleSmall" style={styles.travelerName}>
              {traveler.full_name}
            </Text>
            <Text variant="bodySmall" style={styles.routeText}>
              {selectedMatch.trip.origin_city} → {selectedMatch.trip.destination_city}
            </Text>
          </View>
          {traveler.verified && (
            <MaterialCommunityIcons name="check-decagram" size={20} color="#0066cc" />
          )}
        </View>
      </Surface>

      {/* Chat Lock / Info Banner */}
      {isChatLocked ? (
        <View style={styles.lockBanner}>
          <MaterialCommunityIcons name="lock" size={16} color="#ffffff" />
          <Text variant="bodySmall" style={styles.lockText}>
            Chat locked 24 hours after flight
          </Text>
        </View>
      ) : (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={14} color="#666666" />
          <Text variant="bodySmall" style={styles.infoText}>
            Chat available until 24h after flight on{' '}
            {flightDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      )}

      {/* Messages */}
      {loadingHistory ? (
        <View style={styles.loadingContainer}>
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color="#cccccc" />
              <Text variant="bodyMedium" style={styles.emptyChatText}>
                Say hi to start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <Surface style={styles.inputBar} elevation={4}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={isChatLocked ? 'Chat is locked' : 'Type a message...'}
          mode="outlined"
          style={styles.textInput}
          dense
          disabled={isChatLocked}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          right={
            <TextInput.Icon
              icon="send"
              disabled={!inputText.trim() || sending || isChatLocked}
              onPress={sendMessage}
              color={inputText.trim() && !isChatLocked ? '#0066cc' : '#cccccc'}
            />
          }
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  travelerName: { fontWeight: 'bold', color: '#333333' },
  routeText: { color: '#666666' },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#666666',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lockText: { color: '#ffffff' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: { color: '#666666', flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#999999' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubbleContainer: { marginBottom: 8 },
  myMessageContainer: { alignItems: 'flex-end' },
  theirMessageContainer: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: { backgroundColor: '#0066cc', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4 },
  myMessageText: { color: '#ffffff' },
  theirMessageText: { color: '#333333' },
  timestamp: { fontSize: 10, marginTop: 4 },
  myTimestamp: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  theirTimestamp: { color: '#999999' },
  emptyChat: { alignItems: 'center', paddingVertical: 60 },
  emptyChatText: { color: '#999999', marginTop: 12 },
  inputBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: { backgroundColor: '#ffffff', flex: 1 },
});
