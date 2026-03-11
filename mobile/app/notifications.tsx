// mobile/app/notifications.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/lib/theme';
import { useNotificationStore } from '@/stores/notificationStore';

const TYPE_ICON: Record<string, string> = {
  match: 'handshake',
  message: 'message-text',
  handover: 'package-variant',
  payment: 'credit-card',
  review: 'star',
  system: 'bell',
  flight_update: 'airplane',
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type NotificationItem = ReturnType<typeof useNotificationStore.getState>['notifications'][0];

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const icon = TYPE_ICON[item.notification_type] ?? 'bell';
  const timeAgo = formatTimeAgo(item.created_at);

  return (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, !item.read && styles.iconCircleUnread]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={item.read ? colors.textSecondary : colors.primary}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>{item.title}</Text>
        <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.rowTime}>{timeAgo}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handlePress = (item: NotificationItem) => {
    if (!item.read) markRead(item.id);
    if (item.deep_link) router.push(item.deep_link as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  markAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { fontSize: 15, color: colors.textDisabled },
  listContent: { paddingVertical: spacing.xs },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  rowUnread: { backgroundColor: colors.primarySubtle },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUnread: { backgroundColor: colors.surface },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  rowTitleUnread: { fontWeight: '700' },
  rowBody: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  rowTime: { fontSize: 11, color: colors.textDisabled, marginTop: spacing.xs },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
});
