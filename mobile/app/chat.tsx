/**
 * Chat Screen - Real-time chat with matched traveler via Supabase Realtime
 * Design matches Stitch "Traveler Chat Session" screen:
 * projects/7580322135798196968/screens/c6827f63a8064f56bab45c25f7a0a7d4
 */
import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRequestsStore } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

// Blue for chat bubbles — per Stitch chat design (not global orange primary)
const BUBBLE_BLUE = '#3B82F6';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { selectedMatch } = useRequestsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState(false);
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

  const markMessagesRead = async () => {
    if (!user) return;
    await supabase.rpc('mark_messages_read', { p_match_id: matchId });
  };

  const loadMessageHistory = async () => {
    setLoadingHistory(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setLoadError(true);
      } else {
        setMessages(data ?? []);
        markMessagesRead(); // fire and forget — errors are non-critical
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setLoadError(true);
    } finally {
      setLoadingHistory(false);
    }
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
    if (!content || sending || isChatLocked || !user) return;

    setSending(true);
    setInputText('');

    try {
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: currentUserId,
        content,
      });

      if (error) {
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setInputText(content);
      }
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const travelerInitials = traveler.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const originCode = selectedMatch.trip.origin_city.slice(0, 3).toUpperCase();
  const destCode = selectedMatch.trip.destination_city.slice(0, 3).toUpperCase();

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    const timeStr = new Date(item.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isMe) {
      return (
        <View style={styles.myMessageWrap}>
          <View style={styles.myBubble}>
            <Text style={styles.myBubbleText}>{item.content}</Text>
          </View>
          <Text style={styles.myTimestamp}>{timeStr} · Read</Text>
        </View>
      );
    }

    return (
      <View style={styles.theirMessageWrap}>
        {/* Small avatar shown for received messages */}
        <View style={styles.theirAvatarSmall}>
          {traveler.avatar_url ? (
            <Image source={{ uri: traveler.avatar_url }} style={styles.theirAvatarImg} />
          ) : (
            <View style={styles.theirAvatarFallback}>
              <Text style={styles.theirAvatarInitials}>{travelerInitials[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.theirBubbleGroup}>
          <View style={styles.theirBubble}>
            <Text style={styles.theirBubbleText}>{item.content}</Text>
          </View>
          <Text style={styles.theirTimestamp}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* Left: back + avatar + name/route */}
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.headerAvatarWrap}>
            {traveler.avatar_url ? (
              <Image source={{ uri: traveler.avatar_url }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarInitials}>{travelerInitials}</Text>
              </View>
            )}
            {/* Green online dot */}
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.travelerName}>{traveler.full_name}</Text>
            <View style={styles.routeRow}>
              <MaterialCommunityIcons name="airplane-takeoff" size={12} color="#9ca3af" />
              <Text style={styles.routeText}> {originCode} → {destCode}</Text>
            </View>
          </View>
        </View>

        {/* Right: phone + dots */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="phone-outline" size={22} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info / Lock banner */}
      {isChatLocked ? (
        <View style={styles.lockBanner}>
          <MaterialCommunityIcons name="lock" size={14} color="#ffffff" />
          <Text style={styles.lockText}>Chat locked 24 hours after flight</Text>
        </View>
      ) : (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information" size={14} color="#6366f1" />
          <Text style={styles.infoText}>
            {traveler.full_name.split(' ')[0]} is traveling{' '}
            {flightDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}.
            Chat response times might be slower during the flight.
          </Text>
        </View>
      )}

      {/* ── Messages ── */}
      {loadingHistory ? (
        <View style={styles.centerState}>
          <Text style={styles.centerStateText}>Loading messages...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.centerStateText}>Failed to load messages</Text>
          <Text style={[styles.centerStateText, { color: BUBBLE_BLUE, marginTop: spacing.sm }]} onPress={loadMessageHistory}>
            Tap to retry
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyChatText}>Say hi to start the conversation!</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={styles.inputAddBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={22} color="#6b7280" />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <RNTextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isChatLocked ? 'Chat is locked' : 'Type a message...'}
            placeholderTextColor="#9ca3af"
            style={styles.textInput}
            editable={!isChatLocked}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity style={styles.emojiBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="emoticon-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || sending || isChatLocked) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending || isChatLocked || !user}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: BUBBLE_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  travelerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  routeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    padding: spacing.sm,
    borderRadius: radius.full,
  },

  // ── Banners ───────────────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#eef2ff',        // indigo-50
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',      // indigo-100
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#3730a3',                  // indigo-800
    lineHeight: 16,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    backgroundColor: '#6b7280',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lockText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },

  // ── Messages ─────────────────────────────────────────────────────────────
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },

  // Sent message (me)
  myMessageWrap: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  myBubble: {
    backgroundColor: BUBBLE_BLUE,
    borderRadius: radius.xl,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: '75%',
  },
  myBubbleText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  myTimestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 3,
  },

  // Received message
  theirMessageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  theirAvatarSmall: {
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  theirAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  theirAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  theirAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  theirBubbleGroup: {
    maxWidth: '75%',
    gap: 3,
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderBottomLeftRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  theirBubbleText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  theirTimestamp: {
    fontSize: 10,
    color: '#9ca3af',
  },

  // Empty / loading states
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: spacing.sm,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: spacing.sm + 4,
  },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputAddBtn: {
    padding: spacing.xs,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: spacing.xs,
    maxHeight: 100,
  },
  emojiBtn: {
    padding: spacing.xs,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: BUBBLE_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BUBBLE_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
});
