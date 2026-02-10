"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useGlobalStore } from '@/store/useGlobalStore';

export function AIChatWidget() {
    const { isAIChatOpen: isOpen, setAIChatOpen: setIsOpen } = useGlobalStore();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'ai',
            text: "Hello! I'm your HomeCar assistant. How can I help you find your perfect home or car today?",
        },
    ]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), role: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                role: 'ai',
                text: "That's a great question! I'm analyzing our latest listings and market trends right now. Would you like me to filter results based on your current location or budget?",
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4"
                    >
                        <Card className="w-80 md:w-96 shadow-2xl border-border overflow-hidden">
                            <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center space-x-2">
                                    <div className="bg-white/20 p-1.5 rounded-lg">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle className="text-white text-lg">AI Assistant</CardTitle>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:bg-white/20"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-80 p-4">
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                                        : 'bg-muted text-foreground rounded-bl-none'
                                                        }`}
                                                >
                                                    {message.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-4 border-t border-border bg-muted/50">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex w-full items-center space-x-2"
                                >
                                    <Input
                                        placeholder="Type your message..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="h-10 bg-background border-border"
                                    />
                                    <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-all duration-300 shadow-2xl ${isOpen
                    ? 'h-10 w-10 rounded-xl bg-white hover:bg-muted p-0 border border-border text-foreground ml-auto'
                    : 'h-14 px-7 rounded-2xl bg-gradient-to-r from-[#004e3b] to-[#013460] hover:brightness-125 flex items-center gap-3 border-none shadow-[0_10px_40px_rgba(0,0,0,0.3)]'
                    }`}
            >
                {isOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <>
                        <Bot className="h-6 w-6 text-white" />
                        <span className="text-white p-2 text-lg tracking-tight">Ask AI</span>
                    </>
                )}
            </Button>
        </div>
    );
}
