import { create } from 'zustand';

interface MessagingStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useMessagingStore = create<MessagingStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
