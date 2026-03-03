import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'MESSAGE' | 'APPLICATION' | 'MAINTENANCE' | 'LEASE' | string;
    read: boolean;
    link?: string;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,

    fetchNotifications: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.NOTIFICATIONS);
            const notifications = response.data;
            const unreadCount = notifications.filter((n: Notification) => !n.read).length;
            set({ notifications, unreadCount, loading: false });
        } catch (error: any) {
            set({ error: 'Failed to fetch notifications', loading: false });
            console.error('Fetch notifications error:', error);
        }
    },

    markAsRead: async (id: string) => {
        try {
            await api.put(`${API_ROUTES.NOTIFICATIONS}/${id}/read`);

            const updatedNotifications = get().notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            const unreadCount = updatedNotifications.filter(n => !n.read).length;

            set({ notifications: updatedNotifications, unreadCount });
        } catch (error: any) {
            console.error('Mark as read error:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await api.put(`${API_ROUTES.NOTIFICATIONS}/mark-all-read`);

            const updatedNotifications = get().notifications.map(n => ({ ...n, read: true }));
            set({ notifications: updatedNotifications, unreadCount: 0 });
        } catch (error: any) {
            console.error('Mark all as read error:', error);
        }
    }
}));
