import { create } from 'zustand';
import apiClient from '../api/apiClient';

export type NotificationType = 'SUCCESS' | 'INFO' | 'UPDATE' | 'MESSAGE' | 'APPLICATION' | 'MAINTENANCE' | 'LEASE';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/api/notifications');
      const notifications = response.data;
      const unreadCount = notifications.filter((n: any) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('Fetch notifications error:', error);
      set({ isLoading: false });
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    const { notifications } = get();
    const updated = notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    
    try {
      await apiClient.put('/api/notifications/mark-all-read');
    } catch (error) {
      console.error('Mark all read error:', error);
      // Revert if failed
      get().fetchNotifications();
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const { notifications } = get();
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    set({ 
      notifications: updated, 
      unreadCount: updated.filter(n => !n.read).length 
    });
    
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error('Mark as read error:', error);
      get().fetchNotifications();
    }
  },

  clearAll: async () => {
    // In our backend we don't have a bulk delete, but we can clear locally
    set({ notifications: [], unreadCount: 0 });
    // If backend supports it:
    // try { await apiClient.delete('/api/notifications'); } catch (e) {}
  }
}));
