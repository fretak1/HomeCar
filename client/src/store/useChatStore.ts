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
    activePartnerId: string | null;
    setActivePartner: (partnerId: string | null) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (partnerId: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string) => Promise<ChatMessage | null>;
    initiateChat: (receiverId: string, content?: string) => Promise<string | null>;
    appendMessage: (message: ChatMessage) => void;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    error: null,
    socket: null,
    activePartnerId: null,

    setActivePartner: (partnerId: string | null) => {
        set({ activePartnerId: partnerId });
        // If we switch to someone, immediately clear their unread marks
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
            const response = await api.get(`${API_ROUTES.CHATS}/conversations`);
            
            set(state => {
                const fetchedConversations = response.data;
                // Preserve stubs (conversations that exist locally but have no messages and aren't in fetched yet)
                const localStubs = state.conversations.filter(localC => 
                    !fetchedConversations.some((fetchedC: any) => fetchedC.partnerId === localC.partnerId) && 
                    localC.lastMessage === ''
                );

                const finalConversations = [...localStubs, ...fetchedConversations];
                finalConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                return { conversations: finalConversations, isLoadingConversations: false };
            });
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
        const { activePartnerId, conversations, messages } = get();
        const isActive = activePartnerId === message.senderId;

        // 1. If the user currently has this thread open, quietly tell the backend they've read it!
        if (isActive) {
            api.patch(`${API_ROUTES.CHATS}/read/${message.senderId}`).catch(console.error);
        }

        // 2. Update the sidebar/conversations state
        const updatedConversations = conversations.map(c =>
            c.partnerId === message.senderId
                ? {
                    ...c,
                    lastMessage: message.content,
                    timestamp: message.createdAt,
                    unread: isActive ? 0 : c.unread + 1
                }
                : c
        );

        // If we don't have this conversation in the sidebar yet, we should fetch to inject it
        if (!updatedConversations.some(c => c.partnerId === message.senderId)) {
            get().fetchConversations();
        } else {
            updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }

        // 3. Update the thread: ONLY append if this message belongs to the current open chat
        // If isActive is true, it means we are talking to the sender.
        // If isActive is false, it means we are talking to someone else (or no one).
        const newMessages = isActive ? [...messages, message] : messages;

        set({
            messages: newMessages,
            conversations: updatedConversations
        });
    },

    connectSocket: () => {
        const { socket } = get();
        if (socket) return; // Already connected

        const newSocket = io(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000', {
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
