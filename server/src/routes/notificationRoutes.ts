import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * All notification routes require authentication.
 */
router.use(authenticate);

/**
 * GET /api/notifications
 * Fetch all notifications for the authenticated user.
 */
router.get('/', getNotifications);

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications for the user as read.
 */
router.put('/mark-all-read', markAllAsRead);

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read.
 */
router.put('/:id/read', markAsRead);

export default router;
