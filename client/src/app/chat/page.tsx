"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Search, MessageSquare, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/store/useChatStore';
import { useUserStore } from '@/store/useUserStore';
import ChatLoading from './loading';

function getInitials(name?: string) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimestamp(ts: string) {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
}

function ChatPageInner() {
    const searchParams = useSearchParams();
    const preselectedPartnerId = searchParams.get('partnerId');

    const { currentUser } = useUserStore();
    const {
        conversations,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        fetchConversations,
        fetchMessages,
        sendMessage,
    } = useChatStore();

    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync active partner with global store to gracefully handle real-time unread badges
    useEffect(() => {
        useChatStore.getState().setActivePartner(selectedPartnerId);
    }, [selectedPartnerId]);

    // Load conversations on mount
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser, fetchConversations]);

    // 1. If URL has a partner param, select it immediately whenever it changes
    useEffect(() => {
        if (preselectedPartnerId) {
            setSelectedPartnerId(preselectedPartnerId);
        }
    }, [preselectedPartnerId]);

    // 2. If no URL param is given and we haven't selected anyone, default to the first conversation
    useEffect(() => {
        if (!preselectedPartnerId && !selectedPartnerId && conversations.length > 0) {
            setSelectedPartnerId(conversations[0].partnerId);
        }
    }, [preselectedPartnerId, selectedPartnerId, conversations.length]);

    // Fetch messages when partner selected
    useEffect(() => {
        if (selectedPartnerId) {
            fetchMessages(selectedPartnerId);
        }
    }, [selectedPartnerId, fetchMessages]);

    // Connect to real-time chat websockets
    useEffect(() => {
        if (currentUser) {
            useChatStore.getState().connectSocket();
        }

        return () => {
            useChatStore.getState().disconnectSocket();
        };
    }, [currentUser]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const handleSend = async () => {
        if (!messageText.trim() || !selectedPartnerId) return;
        await sendMessage(selectedPartnerId, messageText.trim());
        setMessageText('');
    };

    const selectedConversation = conversations.find(c => c.partnerId === selectedPartnerId);
    const filteredConversations = conversations.filter(c =>
        c.partnerName.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoadingConversations) {
        return <ChatLoading />;
    }

    return (
        <div className="h-[calc(100vh-73px)] w-full bg-background flex flex-col">
            <div className="flex-1 w-full bg-card border-t border-border overflow-hidden flex">
                <div className="flex w-full h-full">

                    {/* Contacts Sidebar */}
                    <div className="w-96 border-r border-border flex flex-col">
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search conversations..."
                                    className="pl-10 bg-input-background"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            {filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground text-sm">No conversations yet</p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        Apply to a property and get accepted to start chatting
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {filteredConversations.map((contact) => (
                                        <button
                                            key={contact.partnerId}
                                            onClick={() => setSelectedPartnerId(contact.partnerId)}
                                            className={`w-full p-3 rounded-lg text-left transition-colors ${selectedPartnerId === contact.partnerId
                                                ? 'bg-primary/10'
                                                : 'hover:bg-muted'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-12 w-12 bg-primary/10">
                                                    {contact.partnerImage && (
                                                        <AvatarImage src={contact.partnerImage} alt={contact.partnerName} />
                                                    )}
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {getInitials(contact.partnerName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-foreground truncate">{contact.partnerName}</h4>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTimestamp(contact.timestamp)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {contact.lastMessage}
                                                        </p>
                                                        {contact.unread > 0 && (
                                                            <Badge className="bg-primary text-white ml-2">
                                                                {contact.unread}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-border flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 bg-primary/10">
                                        {selectedConversation.partnerImage && (
                                            <AvatarImage src={selectedConversation.partnerImage} alt={selectedConversation.partnerName} />
                                        )}
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(selectedConversation.partnerName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-foreground font-medium">{selectedConversation.partnerName}</h3>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {isLoadingMessages ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-start">
                                                <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
                                                <Skeleton className="h-16 w-64 rounded-2xl" />
                                            </div>
                                            <div className="flex justify-end">
                                                <Skeleton className="h-12 w-48 rounded-2xl" />
                                            </div>
                                            <div className="flex justify-start">
                                                <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
                                                <Skeleton className="h-20 w-72 rounded-2xl" />
                                            </div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                                            <p className="text-muted-foreground">No messages yet. Say hello!</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => {
                                            const isOwn = message.senderId === currentUser?.id;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isOwn && (
                                                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                {getInitials(message.sender?.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={`max-w-md rounded-2xl px-4 py-3 ${isOwn
                                                            ? 'bg-primary text-white'
                                                            : 'bg-muted text-foreground'
                                                            }`}
                                                    >
                                                        <p className="mb-1">{message.content}</p>
                                                        <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                            {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-border bg-card relative z-10 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            placeholder="Type a message..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            className="flex-1 bg-muted/20 border-border text-foreground focus-visible:ring-primary"
                                        />
                                        <Button
                                            onClick={handleSend}
                                            disabled={!messageText.trim()}
                                            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                                        >
                                            <Send className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                                <p className="text-muted-foreground text-sm max-w-xs">
                                    Choose a contact from the left to start messaging
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ChatPageInner />
        </Suspense>
    );
}
