import { create } from 'zustand';

export type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'accessory' | 'franchise';
};

interface CartStore {
  items: CartLine[];
  addItem: (item: { id: string; name: string; price: number; type: 'accessory' | 'franchise' }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: ({ id, name, price, type }) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.id === id);

      if (existing) {
        return {
          items: state.items.map((entry) =>
            entry.id === id ? { ...entry, quantity: entry.quantity + 1 } : entry,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          { id, name, price, quantity: 1, type },
        ],
      };
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items
        .map((entry) =>
          entry.id === id ? { ...entry, quantity: entry.quantity - 1 } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    })),
  clearCart: () => set({ items: [] }),
}));
