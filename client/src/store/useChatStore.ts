import { create } from 'zustand';
import { createApi, API_ROUTES } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

const api = createApi();

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    read: boolean;
    createdAt: string;
    sender?: {
        id: string;
        name: string;
        profileImage?: string;
    };
}

export interface Conversation {
    partnerId: string;
    partnerName: string;
    partnerImage?: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
}

interface ChatState {
    conversations: Conversation[];
    messages: ChatMessage[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    error: string | null;
    socket: Socket | null;
    fetchConversations: () => Promise<void>;
    fetchMessages: (partnerId: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string) => Promise<ChatMessage | null>;
    initiateChat: (receiverId: string, content?: string) => Promise<string | null>;
    appendMessage: (message: ChatMessage) => void;
    connectSocket: (token: string) => void;
    disconnectSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    error: null,
    socket: null,

    fetchConversations: async () => {
        set({ isLoadingConversations: true, error: null });
        try {
            const response = await api.get(`${API_ROUTES.CHATS}/conversations`);
            set({ conversations: response.data, isLoadingConversations: false });
        } catch (error) {
            set({ error: 'Failed to fetch conversations', isLoadingConversations: false });
        }
    },

    fetchMessages: async (partnerId: string) => {
        set({ isLoadingMessages: true, error: null });
        try {
            const response = await api.get(`${API_ROUTES.CHATS}/messages/${partnerId}`);
            const { messages, partner } = response.data;

            set(state => {
                // If this is a brand new conversation, add a stub to the sidebar so it's selectable
                const updatedConversations = [...state.conversations];
                const existingIndex = updatedConversations.findIndex(c => c.partnerId === partnerId);

                if (partner && existingIndex === -1) {
                    updatedConversations.unshift({
                        partnerId: partner.id,
                        partnerName: partner.name,
                        partnerImage: partner.profileImage,
                        lastMessage: '',
                        timestamp: new Date().toISOString(),
                        unread: 0
                    });
                } else if (existingIndex !== -1) {
                    // Reset unread count since we just opened this chat
                    updatedConversations[existingIndex] = {
                        ...updatedConversations[existingIndex],
                        unread: 0
                    };
                }

                // Sort so newest is always at the top
                updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                return {
                    messages,
                    conversations: updatedConversations,
                    isLoadingMessages: false
                };
            });
        } catch (error) {
            set({ error: 'Failed to fetch messages', isLoadingMessages: false });
        }
    },

    sendMessage: async (receiverId: string, content: string) => {
        try {
            const response = await api.post(`${API_ROUTES.CHATS}/send`, { receiverId, content });
            const newMessage: ChatMessage = response.data;

            // Optimistically append to message thread
            set(state => {
                const updatedConversations = state.conversations.map(c =>
                    c.partnerId === receiverId
                        ? { ...c, lastMessage: content, timestamp: newMessage.createdAt }
                        : c
                );

                updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                return {
                    messages: [...state.messages, newMessage],
                    conversations: updatedConversations
                };
            });

            return newMessage;
        } catch (error) {
            set({ error: 'Failed to send message' });
            return null;
        }
    },

    initiateChat: async (receiverId: string, content?: string) => {
        try {
            await api.post(`${API_ROUTES.CHATS}/initiate`, { receiverId, content });
            // Refresh conversations so new one appears in sidebar
            await get().fetchConversations();
            return receiverId;
        } catch (error) {
            set({ error: 'Failed to initiate chat' });
            return null;
        }
    },

    appendMessage: (message: ChatMessage) => {
        set(state => {
            // Keep conversations array sorted and updated with the newest message
            const updatedConversations = state.conversations.map(c =>
                c.partnerId === message.senderId
                    ? {
                        ...c,
                        lastMessage: message.content,
                        timestamp: message.createdAt,
                        unread: c.unread + 1 // Increment unread count globally
                    }
                    : c
            );

            // If we don't have this conversation in the sidebar yet, we should fetch to inject it
            if (!updatedConversations.some(c => c.partnerId === message.senderId)) {
                get().fetchConversations();
            } else {
                updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }

            // If we are currently talking to this person, append to the live chat history
            // Wait to figure out if it's the active partner in the UI
            return {
                messages: [...state.messages, message],
                conversations: updatedConversations
            };
        });
    },

    connectSocket: (token: string) => {
        const { socket } = get();
        if (socket) return; // Already connected

        const newSocket = io('http://localhost:5000', {
            auth: { token },
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('Connected to chat server');
        });

        newSocket.on('new_message', (message: ChatMessage) => {
            get().appendMessage(message);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });

        set({ socket: newSocket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    }
}));
