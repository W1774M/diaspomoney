import { NotificationState } from "@/types";
import { create } from "zustand";

export const useNotificationStore = create<NotificationState>(set => ({
  notifications: [],
  addNotification: notification => {
    const id = Math.random().toString(36).substring(7);
    set(state => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    if (notification.duration !== 0) {
      setTimeout(() => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      }, notification.duration || 5000);
    }
  },
  removeNotification: id =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),
  clearNotifications: () =>
    set({ notifications: [] }),
}));
