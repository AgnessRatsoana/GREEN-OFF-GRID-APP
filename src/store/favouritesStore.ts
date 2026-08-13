import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavouritesStore {
  favourites: string[];
  toggle: (id: string) => void;
  isFavourite: (id: string) => boolean;
}

export const useFavouritesStore = create<FavouritesStore>()(
  persist(
    (set, get) => ({
      favourites: [],
      toggle: (id) => {
        const current = get().favourites;
        if (current.includes(id)) {
          set({ favourites: current.filter((f) => f !== id) });
        } else {
          set({ favourites: [...current, id] });
        }
      },
      isFavourite: (id) => get().favourites.includes(id),
    }),
    {
      name: 'favourites-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favourites: state.favourites }),
    },
  ),
);
