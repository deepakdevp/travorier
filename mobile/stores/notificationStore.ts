// mobile/stores/notificationStore.ts
import { create } from 'zustand';
import { api } from '@/services/api';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  related_entity_type?: string;
  related_entity_id?: string;
  deep_link?: string;
  read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await api.notifications.list();
      const items: NotificationItem[] = res.data;
      set({
        notifications: items,
        unreadCount: items.filter((n) => !n.read).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await api.notifications.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      /* ignore */
    }
  },

  markAllRead: async () => {
    try {
      await api.notifications.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      /* ignore */
    }
  },
}));
