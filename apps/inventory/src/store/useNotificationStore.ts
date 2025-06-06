import { create } from "zustand";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  createdAt: Date;
}

interface NotificationState {
  // State
  notifications: Notification[];
  maxNotifications: number;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setMaxNotifications: (max: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  maxNotifications: 5,

  // Actions
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt,
      // Default auto-close to true for non-error notifications
      autoClose: notification.autoClose ?? notification.type !== "error",
      // Default duration to 5000ms (5s)
      duration: notification.duration ?? 5000,
    };

    set((state) => {
      const notifications = [newNotification, ...state.notifications].slice(
        0,
        state.maxNotifications,
      );
      return { notifications };
    });

    // Auto-close notification if needed
    if (newNotification.autoClose) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => {
      const filteredNotifications = state.notifications.filter(
        (notification) => notification.id !== id,
      );

      // Skip if nothing changed
      if (filteredNotifications.length === state.notifications.length) {
        return state;
      }

      return { notifications: filteredNotifications };
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setMaxNotifications: (max) => {
    // Skip if identical
    if (max === get().maxNotifications) return;

    set((state) => {
      // Trim notifications if needed
      const notifications =
        state.notifications.length > max
          ? state.notifications.slice(0, max)
          : state.notifications;

      return {
        maxNotifications: max,
        notifications,
      };
    });
  },
}));
