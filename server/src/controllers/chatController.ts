import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { emitNewMessage } from '../socket.js';
import { createNotification } from './notificationController.js';
// GET /api/chats/conversations
// Returns unique conversation partners with the latest message per partner
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Get all messages involving this user, newest first
        const allMessages = await prisma.chat.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
                receiver: { select: { id: true, name: true, profileImage: true } }
            }
        });

        // Deduplicate by partner — keep only the latest message per conversation
        const seen = new Set<string>();
        const conversations: any[] = [];

        for (const msg of allMessages) {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;

            if (!seen.has(partnerId)) {
                seen.add(partnerId);

                // Count unread messages from this partner
                const unreadCount = allMessages.filter(
                    m => m.senderId === partnerId && m.receiverId === userId && !m.read
                ).length;

                conversations.push({
                    partnerId,
                    partnerName: partner.name,
                    partnerImage: partner.profileImage,
                    lastMessage: msg.content,
                    timestamp: msg.createdAt,
                    unread: unreadCount,
                });
            }
        }

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/chats/messages/:partnerId
// Returns full message thread between the current user and a partner
export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { partnerId } = req.params;

        const messages = await prisma.chat.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
            }
        });

        // Mark messages from partner as read
        await prisma.chat.updateMany({
            where: {
                senderId: partnerId,
                receiverId: userId,
                read: false
            },
            data: { read: true }
        });

        let partnerDetails = null;

        if (messages.length === 0) {
            // If no messages yet, we still need to send back the partner's basic info so the UI can render a stub
            const partner = await prisma.user.findUnique({
                where: { id: partnerId },
                select: { id: true, name: true, profileImage: true }
            });
            if (partner) {
                partnerDetails = {
                    id: partner.id,
                    name: partner.name,
                    profileImage: partner.profileImage
                };
            }
        }

        res.json({ messages, partner: partnerDetails });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/chats/send
// Sends a message from the current user to receiverId
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const { receiverId, content } = req.body;

        if (!receiverId || !content?.trim()) {
            return res.status(400).json({ error: 'receiverId and content are required' });
        }

        const message = await prisma.chat.create({
            data: {
                senderId,
                receiverId,
                content: content.trim(),
            },
            include: {
                sender: { select: { id: true, name: true, profileImage: true } }
            }
        });

        // Notify receiving user in real-time
        emitNewMessage(receiverId, message);

        // Create persistent notification
        await createNotification(
            receiverId,
            'New Message',
            `You have a new message from ${message.sender.name}`,
            'MESSAGE',
            `/dashboard/chat?partnerId=${senderId}`
        );

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/chats/initiate
// Creates the opening message when a customer clicks "Start Chat"
// If a conversation already exists, just returns the partnerId without creating a duplicate
export const initiateChat = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const { receiverId, content } = req.body;

        if (!receiverId) {
            return res.status(400).json({ error: 'receiverId is required' });
        }

        // Check if a conversation already exists
        const existing = await prisma.chat.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (!existing && content?.trim()) {
            // Create the opening message only if content is provided
            const message = await prisma.chat.create({
                data: {
                    senderId,
                    receiverId,
                    content: content.trim(),
                },
                include: {
                    sender: { select: { name: true } }
                }
            });

            // Create persistent notification for initiated chat
            await createNotification(
                receiverId,
                'New Conversation',
                `${message.sender.name} started a new conversation with you.`,
                'MESSAGE',
                `/dashboard/chat?partnerId=${senderId}`
            );
        }

        res.json({ partnerId: receiverId, initiated: !existing });
    } catch (error) {
        console.error('Error initiating chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
