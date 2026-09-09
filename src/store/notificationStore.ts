import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '../services/notifications/notifications';

const LOCAL_STORAGE_KEY = 'local-notifications-storage';

function persistLocalNotifications(notifications: AppNotification[]) {
  void AsyncStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(notifications),
  ).catch(() => undefined);
}

async function loadLocalNotifications(): Promise<AppNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;

  setNotifications: (notifications: AppNotification[]) => void;

  setUnreadCount: (count: number) => void;

  addNotification: (notification: AppNotification) => void;

  updateNotification: (
    notificationId: string,
    updates: Partial<AppNotification>,
  ) => void;

  removeNotification: (notificationId: string) => void;

  loadNotifications: () => Promise<void>;

  refreshUnreadCount: () => Promise<void>;

  markAsRead: (notificationId: string) => Promise<void>;

  markAllAsRead: () => Promise<void>;

  clearNotifications: () => void;

  addLocalNotification: (input: {
    id: string;
    userId: string;
    type: AppNotification['type'];
    title: string;
    message: string;
    referenceId?: string | null;
    referenceType?: AppNotification['referenceType'];
  }) => void;

  removeLocalNotifications: (prefix: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  unreadCount: 0,

  isLoading: false,

  isInitialized: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter(
        (notification) => !notification.isRead,
      ).length,
      isInitialized: true,
    }),

  setUnreadCount: (unreadCount) =>
    set({
      unreadCount,
    }),

  addNotification: (notification) =>
    set((state) => {
      const alreadyExists = state.notifications.some(
        (item) => item.id === notification.id,
      );

      if (alreadyExists) {
        return state;
      }

      return {
        notifications: [
          notification,
          ...state.notifications,
        ],
        unreadCount: notification.isRead
          ? state.unreadCount
          : state.unreadCount + 1,
      };
    }),

  updateNotification: (notificationId, updates) =>
    set((state) => {
      const existingNotification = state.notifications.find(
        (notification) => notification.id === notificationId,
      );

      if (!existingNotification) {
        return state;
      }

      const updatedNotification = {
        ...existingNotification,
        ...updates,
      };

      let unreadCount = state.unreadCount;

      if (
        existingNotification.isRead &&
        !updatedNotification.isRead
      ) {
        unreadCount += 1;
      }

      if (
        !existingNotification.isRead &&
        updatedNotification.isRead
      ) {
        unreadCount = Math.max(0, unreadCount - 1);
      }

      return {
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? updatedNotification
            : notification,
        ),
        unreadCount,
      };
    }),

  removeNotification: (notificationId) =>
    set((state) => {
      const notification = state.notifications.find(
        (item) => item.id === notificationId,
      );

      if (!notification) {
        return state;
      }

      return {
        notifications: state.notifications.filter(
          (item) => item.id !== notificationId,
        ),
        unreadCount: notification.isRead
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1),
      };
    }),

  loadNotifications: async () => {
    set({
      isLoading: true,
    });

    try {
      const [notifications, localNotifications] = await Promise.all([
        fetchNotifications().catch(() => []),
        loadLocalNotifications(),
      ]);
      const allNotifications = [...localNotifications, ...notifications]
        .sort((left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
        );

      set({
        notifications: allNotifications,
        unreadCount: allNotifications.filter(
          (notification) => !notification.isRead,
        ).length,
        isInitialized: true,
      });
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  refreshUnreadCount: async () => {
    const count = await fetchUnreadNotificationCount();
    const localUnreadCount = useNotificationStore
      .getState()
      .notifications.filter(
        (notification) =>
          notification.id.startsWith('local-') && !notification.isRead,
      ).length;

    set({
      unreadCount: count + localUnreadCount,
    });
  },

  markAsRead: async (notificationId) => {
    if (notificationId.startsWith('local-')) {
      set((state) => {
        const notifications = state.notifications.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        );
        persistLocalNotifications(
          notifications.filter((item) => item.id.startsWith('local-')),
        );
        return {
          notifications,
          unreadCount: Math.max(
            0,
            state.unreadCount -
              (state.notifications.some(
                (item) => item.id === notificationId && !item.isRead,
              )
                ? 1
                : 0),
          ),
        };
      });
      return;
    }

    await markNotificationAsRead(notificationId);

    set((state) => {
      const notification = state.notifications.find(
        (item) => item.id === notificationId,
      );

      if (!notification || notification.isRead) {
        return state;
      }

      return {
        notifications: state.notifications.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: async () => {
    await markAllNotificationsAsRead();

    set((state) => ({
      notifications: state.notifications.map(
        (notification) => ({
          ...notification,
          isRead: true,
        }),
      ),
      unreadCount: 0,
    }));
    persistLocalNotifications(
      useNotificationStore
        .getState()
        .notifications.filter((item) => item.id.startsWith('local-')),
    );
  },

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isInitialized: false,
    }),

  addLocalNotification: (input) =>
    set((state) => {
      const notification: AppNotification = {
        id: input.id,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        referenceId: input.referenceId ?? null,
        referenceType: input.referenceType ?? null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      const existing = state.notifications.find(
        (item) => item.id === notification.id,
      );
      const notifications = existing
        ? state.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          )
        : [notification, ...state.notifications];

      persistLocalNotifications(
        notifications.filter((item) => item.id.startsWith('local-')),
      );

      return {
        notifications,
        unreadCount:
          state.unreadCount + (existing && !existing.isRead ? 0 : 1),
      };
    }),

  removeLocalNotifications: (prefix) =>
    set((state) => {
      const removed = state.notifications.filter(
        (item) => item.id.startsWith(prefix),
      );
      const notifications = state.notifications.filter(
        (item) => !item.id.startsWith(prefix),
      );
      persistLocalNotifications(
        notifications.filter((item) => item.id.startsWith('local-')),
      );
      return {
        notifications,
        unreadCount: Math.max(
          0,
          state.unreadCount - removed.filter((item) => !item.isRead).length,
        ),
      };
    }),
}));