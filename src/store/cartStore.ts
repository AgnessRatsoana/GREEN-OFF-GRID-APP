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
const CART_EXPIRY_MS = 10 * 60 * 1000;

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
            { id, name, price, quantity, type, imageUrl: imageUrl ?? null, addedAt: now },
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
        message: `${name} is waiting in your cart. Complete checkout within 10 minutes.`,
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
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedItems = JSON.parse(stored) as Array<CartLine & { addedAt?: number }>;
        const now = Date.now();
        const items = parsedItems
          .map((item) => ({ ...item, addedAt: item.addedAt ?? now }))
          .filter((item) => now - item.addedAt < CART_EXPIRY_MS);

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
    const items = currentItems.filter(
      (item) => now - item.addedAt < CART_EXPIRY_MS,
    );

    if (items.length !== currentItems.length) {
      persist(items);
      set({ items });
      const activeIds = new Set(items.map((item) => item.id));
      currentItems
        .filter((item) => !activeIds.has(item.id))
        .forEach((item) =>
          useNotificationStore
            .getState()
            .removeLocalNotifications(`local-cart-${item.id}`),
        );
    }
  },
  startExpiryWatcher: () => {
    const intervalId = setInterval(() => {
      get().expireStaleItems();
    }, 30 * 1000);

    return () => clearInterval(intervalId);
  },
}));
