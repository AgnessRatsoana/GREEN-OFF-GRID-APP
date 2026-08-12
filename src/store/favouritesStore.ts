import { create } from 'zustand';

interface FavouritesStore {
  favourites: string[];
  toggle: (id: string) => void;
  isFavourite: (id: string) => boolean;
}

export const useFavouritesStore = create<FavouritesStore>((set, get) => ({
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
}));
