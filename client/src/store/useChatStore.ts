import { create } from 'zustand';
import { Message } from '@/data/mockData';
import { createApi, API_ROUTES } from '@/lib/api';

const api = createApi();

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    fetchMessages: (userId: string) => Promise<void>;
    sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    error: null,
    fetchMessages: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(API_ROUTES.MESSAGES, { params: { userId } });
            set({ messages: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch messages', isLoading: false });
        }
    },
    sendMessage: async (newMsg) => {
        set({ isLoading: true });
        try {
            const response = await api.post(API_ROUTES.MESSAGES, newMsg);
            set((state) => ({ messages: [...state.messages, response.data], isLoading: false }));
        } catch (error) {
            set({ error: 'Failed to send message', isLoading: false });
        }
    },

    markAsRead: async (id) => {
        set({ isLoading: true });
        try {
            await api.patch(`${API_ROUTES.MESSAGES}/${id}`, { read: true });
            set((state) => ({
                messages: state.messages.map(m => m.id === id ? { ...m, read: true } : m),
                isLoading: false
            }));
        } catch (error) {
            set({ error: 'Failed to mark message as read', isLoading: false });
        }
    }

                                                                            
}));
