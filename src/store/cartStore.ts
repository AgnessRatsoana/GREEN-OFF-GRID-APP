import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

export type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'accessory' | 'franchise';
  imageUrl?: string | null;
  addedAt: number;
  reminderSentAt?: number | null;
};

interface CartStore {
  items: CartLine[];
  addItem: (item: { id: string; name: string; price: number; type: 'accessory' | 'franchise'; imageUrl?: string | null }, quantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
  expireStaleItems: () => void;
  startExpiryWatcher: () => () => void;
}

const STORAGE_KEY = 'cart-storage';
const CART_REMINDER_MS = 60 * 60 * 1000;

function persist(items: CartLine[]) {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: ({ id, name, price, type, imageUrl }, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((entry) => entry.id === id);

      const now = Date.now();
      const items = existing
        ? state.items.map((entry) =>
            entry.id === id
              ? { ...entry, quantity: entry.quantity + quantity, addedAt: now }
              : entry,
          )
        : [
            ...state.items,
            { id, name, price, quantity, type, imageUrl: imageUrl ?? null, addedAt: now, reminderSentAt: null },
          ];

      persist(items);
      return { items };
    });
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      useNotificationStore.getState().addLocalNotification({
        id: `local-cart-${id}`,
        userId,
        type: 'cart',
        title: 'Cart updated',
        message: `${name} is waiting in your cart. Complete checkout when you are ready.`,
        referenceId: null,
        referenceType: 'cart',
      });
    }
  },
  removeItem: (id) =>
    set((state) => {
      const items = state.items
        .map((entry) =>
          entry.id === id ? { ...entry, quantity: entry.quantity - 1 } : entry,
        )
        .filter((entry) => entry.quantity > 0);
      persist(items);
      return { items };
    }),
  clearCart: () => {
    persist([]);
    set({ items: [] });
    useNotificationStore.getState().removeLocalNotifications('local-cart-');
    useNotificationStore.getState().removeLocalNotifications('local-cart-reminder-');
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedItems = JSON.parse(stored) as Array<CartLine & { addedAt?: number }>;
        const now = Date.now();
        const items = parsedItems.map((item) => ({
          ...item,
          addedAt: item.addedAt ?? now,
          reminderSentAt: item.reminderSentAt ?? null,
        }));

        set({ items });
        persist(items);
      }
    } catch {
      // Ignore corrupt storage; start with an empty cart.
    }
  },
  expireStaleItems: () => {
    const now = Date.now();
    const currentItems = get().items;
    let changed = false;
    const items = currentItems.map((item) => {
      if (now - item.addedAt >= CART_REMINDER_MS && !item.reminderSentAt) {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          useNotificationStore.getState().addLocalNotification({
            id: `local-cart-reminder-${item.id}`,
            userId,
            type: 'cart',
            title: 'Cart reminder',
            message: `${item.name} is still in your cart. Complete checkout when you are ready.`,
            referenceId: null,
            referenceType: 'cart',
          });
        }
        changed = true;
        return { ...item, reminderSentAt: now };
      }
      return item;
    });

    if (changed) {
      persist(items);
      set({ items });
    }
  },
  startExpiryWatcher: () => {
    const intervalId = setInterval(() => {
      get().expireStaleItems();
    }, 30 * 1000);

    return () => clearInterval(intervalId);
  },
}));
