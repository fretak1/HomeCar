"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAIStore } from '@/store/useAIStore';
import { Bot, Send, X, MessageSquare, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const normalizeChatHref = (rawHref: string): { isInternal: boolean; href: string } => {
    const trimmed = rawHref.trim();
    const sanitized = trimmed.replace(/[)\],.!?;:]+$/, '');
    
    const toInternalPath = (value: string) => {
        const withoutProtocolLike = value.replace(/^[a-zA-Z]+:\/*/, '');
        const noLeadingSlash = withoutProtocolLike.replace(/^\/+/, '');
        return `/${noLeadingSlash}`;
    };

    if (sanitized.startsWith('nav:')) {
        return { isInternal: true, href: toInternalPath(sanitized) };
    }

    if (sanitized.startsWith('/')) {
        return { isInternal: true, href: `/${sanitized.replace(/^\/+/, '')}` };
    }

    if (/^(property|listings|search|dashboard|chat|profile)\b/i.test(sanitized)) {
        return { isInternal: true, href: toInternalPath(sanitized) };
    }

    try {
        // If it starts with http, it might be internal or external
        if (sanitized.startsWith('http')) {
            const parsed = new URL(sanitized);
            if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
                const normalizedPath = `/${parsed.pathname.replace(/^\/+/, '')}`;
                return { isInternal: true, href: `${normalizedPath}${parsed.search}${parsed.hash}` };
            }
            return { isInternal: false, href: sanitized };
        }
        
        // If it doesn't start with http/nav// and it's not a known internal route, treat it as relative/unknown
        return { isInternal: false, href: sanitized };
    } catch {
        return { isInternal: false, href: sanitized };
    }
};

export const AskAIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const { chatHistory, isChatLoading, sendMessageToAI } = useAIStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (!message.trim() || isChatLoading) return;
        const currentMessage = message;
        setMessage('');
        await sendMessageToAI(currentMessage);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 32, scale: 0.9, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="flex flex-col items-end gap-3"
                    >
                        <Card className="w-[420px] h-[600px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.15),0_0_1px_rgba(0,0,0,0.2)] border-black/5 bg-white overflow-hidden rounded-[2rem]">
                            <div className="p-6 pb-4 flex items-center justify-between bg-white border-b border-black/5">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#004e3b] to-[#013460] flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Bot className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-[#101828] text-base leading-none">HomeCar Assistant</h3>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">Online & Ready</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full hover:bg-black/5 transition-colors"
                                >
                                    <X className="w-5 h-5 text-[#667085]" />
                                </Button>
                            </div>

                            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
                                {chatHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center">
                                            <MessageSquare className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-semibold text-[#101828]"> I’m your HomeCar assistant.</h4>
                                            <p className="text-sm text-[#667085] max-w-[240px] leading-relaxed">How can I help you find your perfect home or car today?</p>
                                        </div>
                                    </div>
                                )}

                                {chatHistory.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`group relative max-w-[85%] px-5 py-3.5 rounded-[1.4rem] text-sm leading-relaxed transition-all ${m.role === 'user'
                                            ? 'bg-[#004e3b] text-white rounded-tr-none shadow-md shadow-primary/10'
                                            : 'bg-white border border-black/5 rounded-tl-none shadow-sm text-[#344054]'
                                            }`}>
                                            {m.role === 'user' ? (
                                                m.parts
                                            ) : (
                                                <div className="markdown-container text-[#344054] leading-relaxed">
                                                    <ReactMarkdown
                                                        components={{
                                                            a: ({ node, ...props }) => {
                                                                const href = props.href || '';
                                                                console.log('[ChatBot] Link detected:', { href });
                                                                const normalized = normalizeChatHref(href);
                                                                const cleanPath = normalized.isInternal ? normalized.href : href;

                                                                const handleClick = (e: React.MouseEvent) => {
                                                                    if (normalized.isInternal) {
                                                                        e.preventDefault();
                                                                        console.log('[ChatBot] Internal navigation to:', cleanPath);
                                                                        router.push(cleanPath);
                                                                        setTimeout(() => setIsOpen(false), 100);
                                                                    }
                                                                };

                                                                return (
                                                                    <a
                                                                        href={cleanPath}
                                                                        className="text-[#004e3b] hover:underline font-bold transition-all cursor-pointer inline-block"
                                                                        onClick={handleClick}
                                                                        {...(!normalized.isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                                    >
                                                                        {props.children}
                                                                    </a>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {m.parts.replace(/nav:(\/*)/g, '/')}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-black/5 px-4 py-3 rounded-[1.4rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <div className="p-6 bg-white">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="group flex items-center w-full gap-2 bg-white border border-black/10 rounded-2xl p-2 transition-all focus-within:border-[#004e3b] focus-within:shadow-[0_0_0_4px_rgba(0,78,59,0.1)]"
                                >
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-2 text-sm text-[#101828] placeholder:text-[#98a2b3]"
                                        disabled={isChatLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isChatLoading || !message.trim()}
                                        className="rounded-xl bg-[#004e3b] hover:bg-[#00382a] transition-all h-10 w-10 shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                                <p className="text-center text-[10px] text-[#98a2b3] mt-4 font-medium uppercase tracking-[0.1em]">Verified HomeCar Intelligence</p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-16 px-8 rounded-2xl bg-[#004e3b] hover:bg-[#005a44] flex items-center gap-4 border-none shadow-[0_10px_30px_rgba(0,78,59,0.3)] transition-all relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="relative">
                            <Bot className="w-7 h-7 text-white" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#004e3b] animate-pulse" />
                        </div>
                        <span className="text-white font-semibold text-lg tracking-tight">Ask Ai</span>
                    </Button>
                </motion.div>
            )}
        </div>
    );

};
