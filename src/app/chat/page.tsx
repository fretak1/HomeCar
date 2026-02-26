"use client";

import { useState } from 'react';
import { Send, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockMessages } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Contact {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
    online: boolean;
}

const mockContacts: Contact[] = [
    {
        id: 'owner1',
        name: 'Frezer Takele',
        avatar: 'JS',
        lastMessage: 'Absolutely! How about Saturday at 2 PM?',
        timestamp: '11:45 AM',
        unread: 1,
        online: true,
    },
    {
        id: 'owner2',
        name: 'Dawit Tadesse',
        avatar: 'SJ',
        lastMessage: 'The apartment is still available.',
        timestamp: 'Yesterday',
        unread: 0,
        online: false,
    },
    {
        id: 'owner3',
        name: 'Yayneabeba Taye',
        avatar: 'MB',
        lastMessage: 'Thanks for your interest!',
        timestamp: '2 days ago',
        unread: 0,
        online: true,
    },
];

export default function ChatPage() {
    const [selectedContact, setSelectedContact] = useState<Contact>(mockContacts[0]);
    const [messageText, setMessageText] = useState('');

    const [messages, setMessages] = useState(mockMessages);

    const handleSendMessage = () => {
        if (messageText.trim()) {
            const newMessage = {
                id: Date.now().toString(),
                senderId: 'user1',
                senderName: 'Current User',
                receiverId: selectedContact.id,
                content: messageText,
                timestamp: new Date().toISOString(),
                read: false,
            };
            setMessages([...messages, newMessage]);
            setMessageText('');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl mb-6 text-foreground">Messages</h1>

                <Card className="border-border overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
                    <div className="flex h-full">
                        {/* Contacts Sidebar */}
                        <div className="w-80 border-r border-border flex flex-col">
                            <div className="p-4 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search conversations..."
                                        className="pl-10 bg-input-background"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="space-y-1 p-2">
                                    {mockContacts.map((contact) => (
                                        <button
                                            key={contact.id}
                                            onClick={() => setSelectedContact(contact)}
                                            className={`w-full p-3 rounded-lg text-left transition-colors ${selectedContact.id === contact.id
                                                ? 'bg-primary/10'
                                                : 'hover:bg-muted'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12 bg-primary/10">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {contact.avatar}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {contact.online && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="text-foreground truncate">{contact.name}</h4>
                                                        <span className="text-xs text-muted-foreground">
                                                            {contact.timestamp}
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
                            </ScrollArea>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 bg-primary/10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {selectedContact.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        {selectedContact.online && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-foreground">{selectedContact.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedContact.online ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((message) => {
                                    const isOwn = message.senderId === 'user1';
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-md rounded-2xl px-4 py-3 ${isOwn
                                                    ? 'bg-primary text-white'
                                                    : 'bg-muted text-foreground'
                                                    }`}
                                            >
                                                <p className="mb-1">{message.content}</p>
                                                <p
                                                    className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-border bg-white relative z-10 shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1 bg-gray-50 border-gray-200 text-foreground focus-visible:ring-primary"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
