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
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRequestsStore } from '@/stores/requestsStore';
import { colors, spacing, radius } from '@/lib/theme';

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {/* Avatar on the left for received messages */}
        {!isMe && (
          <View style={styles.receivedAvatarWrapper}>
            {traveler.avatar_url ? (
              <Avatar.Image size={28} source={{ uri: traveler.avatar_url }} />
            ) : (
              <Avatar.Text size={28} label={travelerInitials} style={styles.receivedAvatar} />
            )}
          </View>
        )}

        <View style={styles.bubbleCol}>
          <View
            style={[
              styles.bubble,
              isMe ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            <Text
              variant="bodyMedium"
              style={isMe ? styles.sentText : styles.receivedText}
            >
              {item.content}
            </Text>
          </View>
          <Text
            variant="labelSmall"
            style={[styles.timestamp, isMe ? styles.timestampRight : styles.timestampLeft]}
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          {traveler.avatar_url ? (
            <Avatar.Image size={40} source={{ uri: traveler.avatar_url }} />
          ) : (
            <Avatar.Text size={40} label={travelerInitials} style={styles.headerAvatarText} />
          )}
          {/* Online indicator dot */}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text variant="titleSmall" style={styles.headerName}>
              {traveler.full_name}
            </Text>
            {traveler.verified && (
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color={colors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <Text variant="labelSmall" style={styles.headerRoute}>
            {selectedMatch.trip.origin_city} → {selectedMatch.trip.destination_city}
          </Text>
        </View>
      </View>

      {/* ── Chat Lock / Info Banner ── */}
      {isChatLocked ? (
        <View style={styles.lockBanner}>
          <MaterialCommunityIcons name="lock" size={14} color={colors.surface} />
          <Text variant="labelSmall" style={styles.lockBannerText}>
            Chat locked 24 hours after flight
          </Text>
        </View>
      ) : (
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={14} color={colors.textSecondary} />
          <Text variant="labelSmall" style={styles.infoBannerText}>
            Chat available until 24h after flight on{' '}
            {flightDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      )}

      {/* ── Messages ── */}
      {loadingHistory ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text variant="bodySmall" style={styles.centeredStateText}>
            Loading messages…
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.centeredState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color={colors.border} />
          <Text variant="bodyMedium" style={styles.centeredStateText}>
            Failed to load messages
          </Text>
          <TouchableOpacity onPress={loadMessageHistory} style={styles.retryButton}>
            <Text variant="labelMedium" style={styles.retryButtonText}>
              Tap to retry
            </Text>
          </TouchableOpacity>
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
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.border} />
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                Say hi to start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* ── Input Bar ── */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={isChatLocked ? 'Chat is locked' : 'Type a message…'}
            placeholderTextColor={colors.textDisabled}
            style={styles.textInput}
            editable={!isChatLocked}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={sendMessage}
          disabled={!inputText.trim() || sending || isChatLocked || !user}
          style={[
            styles.sendButton,
            (!inputText.trim() || sending || isChatLocked || !user) && styles.sendButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size={16} color={colors.surface} />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color={colors.surface} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerAvatar: {
    position: 'relative',
  },
  headerAvatarText: {
    backgroundColor: colors.primarySubtle,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerName: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  verifiedIcon: {
    marginTop: 1,
  },
  headerRoute: {
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ── Banners ──────────────────────────────────────────────────────────────
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lockBannerText: {
    color: colors.surface,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoBannerText: {
    color: colors.textSecondary,
    flex: 1,
  },

  // ── Message list ─────────────────────────────────────────────────────────
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },

  // ── Message row ──────────────────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm + 4,
    alignItems: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },

  // ── Avatar (received) ────────────────────────────────────────────────────
  receivedAvatarWrapper: {
    marginRight: spacing.sm,
    marginBottom: 2,
  },
  receivedAvatar: {
    backgroundColor: colors.primarySubtle,
  },

  // ── Bubble ───────────────────────────────────────────────────────────────
  bubbleCol: {
    maxWidth: '72%',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xl,
  },
  sentBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  receivedBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sentText: {
    color: colors.surface,
  },
  receivedText: {
    color: colors.textPrimary,
  },

  // ── Timestamp ────────────────────────────────────────────────────────────
  timestamp: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 10,
  },
  timestampRight: {
    textAlign: 'right',
  },
  timestampLeft: {
    textAlign: 'left',
  },

  // ── States ───────────────────────────────────────────────────────────────
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  centeredStateText: {
    color: colors.textSecondary,
  },
  retryButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
  },
  retryButtonText: {
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyStateText: {
    color: colors.textSecondary,
  },

  // ── Input bar ────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
});
