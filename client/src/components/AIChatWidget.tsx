"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

import { useGlobalStore } from '@/store/useGlobalStore';

// Define the API URL for the AI service
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

export function AIChatWidget() {
    const { isAIChatOpen: isOpen, setAIChatOpen: setIsOpen } = useGlobalStore();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessageText = input.trim();
        const userMessage = { id: Date.now(), role: 'user', text: userMessageText };
        
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Map messages to the history format expected by the backend
            // Backend expects: List[Dict[str, str]] with 'role' and 'content' (or 'parts')
            const history = messages.map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user', // Backend maps 'model' to 'assistant'
                content: msg.text
            }));

            const response = await axios.post(`${AI_SERVICE_URL}/api/v1/chat`, {
                message: userMessageText,
                history: history
            });

            const aiResponse = {
                id: Date.now() + 1,
                role: 'ai',
                text: response.data.response,
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
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
                                <ScrollArea className="h-80 p-4" viewportRef={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                                                <Bot className="h-8 w-8 opacity-20" />
                                                <p className="text-sm">Ask me anything about HomeCar!</p>
                                            </div>
                                        )}
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
                                                    <ReactMarkdown
                                                        components={{
                                                            a: ({ node, ...props }) => (
                                                                <a 
                                                                    {...props} 
                                                                    className="text-[#065f46] hover:text-[#047857] hover:underline font-bold transition-all cursor-pointer inline-block pointer-events-auto" 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    style={{ textDecoration: 'underline' }}
                                                                />
                                                            ),
                                                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                                        }}
                                                    >
                                                        {message.text}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-2 text-sm flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Searching...
                                                </div>
                                            </div>
                                        )}
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
                                        disabled={isLoading}
                                    />
                                    <Button 
                                        type="submit" 
                                        size="icon" 
                                        className="h-10 w-10 shrink-0"
                                        disabled={isLoading || !input.trim()}
                                    >
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
