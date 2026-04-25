import { create } from 'zustand';
import { io, Socket } from 'socket.io-client/dist/socket.io.js';
import apiClient from '../api/apiClient';
import { Platform } from 'react-native';

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
    activePartnerId: string | null;
    activePartnerName: string | null;
    
    setActivePartner: (partnerId: string | null, partnerName?: string) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (partnerId: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string) => Promise<ChatMessage | null>;
    appendMessage: (message: ChatMessage) => void;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

const getSocketUrl = () => {
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
    return 'http://localhost:5000';
};

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    error: null,
    socket: null,
    activePartnerId: null,
    activePartnerName: null,

    setActivePartner: (partnerId, partnerName) => {
        set({ activePartnerId: partnerId, activePartnerName: partnerName || null });
        if (partnerId) {
            set(state => ({
                conversations: state.conversations.map(c => 
                    c.partnerId === partnerId ? { ...c, unread: 0 } : c
                )
            }));
        }
    },

    fetchConversations: async () => {
        set({ isLoadingConversations: true, error: null });
        try {
            const response = await apiClient.get('/api/chats/conversations');
            const sorted = response.data.sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            set({ conversations: sorted, isLoadingConversations: false });
        } catch (error) {
            set({ error: 'Failed to fetch conversations', isLoadingConversations: false });
        }
    },

    fetchMessages: async (partnerId) => {
        set({ isLoadingMessages: true, error: null });
        try {
            const response = await apiClient.get(`/api/chats/messages/${partnerId}`);
            set({ 
                messages: response.data.messages, 
                activePartnerName: response.data.partner?.name || null,
                isLoadingMessages: false 
            });
        } catch (error) {
            set({ error: 'Failed to fetch messages', isLoadingMessages: false });
        }
    },

    sendMessage: async (receiverId, content) => {
        try {
            const response = await apiClient.post('/api/chats/send', { receiverId, content });
            const newMessage: ChatMessage = response.data;

            set(state => ({
                messages: [...state.messages, newMessage],
                conversations: state.conversations.map(c =>
                    c.partnerId === receiverId
                        ? { ...c, lastMessage: content, timestamp: newMessage.createdAt }
                        : c
                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            }));

            return newMessage;
        } catch (error) {
            set({ error: 'Failed to send message' });
            return null;
        }
    },

    appendMessage: (message) => {
        const { activePartnerId, conversations, messages } = get();
        const isActive = activePartnerId === message.senderId;

        if (isActive) {
            apiClient.patch(`/api/chats/read/${message.senderId}`).catch(console.error);
        }

        const updatedConversations = conversations.map(c =>
            c.partnerId === message.senderId
                ? {
                    ...c,
                    lastMessage: message.content,
                    timestamp: message.createdAt,
                    unread: isActive ? 0 : c.unread + 1
                }
                : c
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const newMessages = isActive ? [...messages, message] : messages;

        set({
            messages: newMessages,
            conversations: updatedConversations
        });
    },

    connectSocket: () => {
        const { socket } = get();
        if (socket) return;

        const newSocket = io(getSocketUrl());

        newSocket.on('connect', () => console.log('Chat Socket Connected'));
        newSocket.on('new_message', (message: ChatMessage) => get().appendMessage(message));
        newSocket.on('disconnect', () => console.log('Chat Socket Disconnected'));

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
