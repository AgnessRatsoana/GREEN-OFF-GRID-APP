import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'accessory' | 'franchise';
  imageUrl?: string | null;
};

interface CartStore {
  items: CartLine[];
  addItem: (item: { id: string; name: string; price: number; type: 'accessory' | 'franchise'; imageUrl?: string | null }, quantity?: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'cart-storage';

function persist(items: CartLine[]) {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: ({ id, name, price, type, imageUrl }, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.id === id);

      const items = existing
        ? state.items.map((entry) =>
            entry.id === id ? { ...entry, quantity: entry.quantity + quantity } : entry,
          )
        : [
            ...state.items,
            { id, name, price, quantity, type, imageUrl: imageUrl ?? null },
          ];

      persist(items);
      return { items };
    }),
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
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored) as CartLine[] });
      }
    } catch {
      // Ignore corrupt storage; start with an empty cart.
    }
  },
}));
