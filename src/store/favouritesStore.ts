import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface FavouritesStore {
  favourites: string[];
  toggle: (id: string) => void;
  isFavourite: (id: string) => boolean;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'favourites-storage';

export const useFavouritesStore =
  create<FavouritesStore>((set, get) => ({
    favourites: [],

    toggle: (id) => {
      const current = get().favourites;

      const next = current.includes(id)
        ? current.filter((f) => f !== id)
        : [...current, id];

      set({ favourites: next });

      void AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next),
      );
    },

    isFavourite: (id) =>
      get().favourites.includes(id),

    hydrate: async () => {
      try {
        const stored =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (!stored) {
          return;
        }

        const parsed: unknown =
          JSON.parse(stored);

        if (Array.isArray(parsed)) {
          set({
            favourites: parsed.filter(
              (item): item is string =>
                typeof item === 'string',
            ),
          });

          return;
        }

        // Handles the old persisted Zustand format
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'state' in parsed
        ) {
          const state = (
            parsed as {
              state?: {
                favourites?: unknown;
              };
            }
          ).state;

          if (Array.isArray(state?.favourites)) {
            set({
              favourites:
                state.favourites.filter(
                  (item): item is string =>
                    typeof item === 'string',
                ),
            });
          }
        }
      } catch (error) {
        console.error(
          'Failed to load favourites:',
          error,
        );
      }
    },
  }));