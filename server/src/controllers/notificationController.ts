import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Fetches notifications for the authenticated user.
 */
export const getNotifications = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Increased from 20 to 50 for better UX
        });
        res.json(notifications);
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

/**
 * Marks a specific notification as read.
 */
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json(notification);
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

/**
 * Marks all unread notifications for a user as read.
 */
export const markAllAsRead = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

/**
 * Internal helper to create notifications from other controllers.
 * This is not an exported Express route handler.
 */
export const createNotification = async (userId: string, title: string, message: string, type: string, link?: string) => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link,
                read: false
            }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
