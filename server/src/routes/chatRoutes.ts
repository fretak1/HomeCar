import express from 'express';
import { getConversations, getMessages, sendMessage, initiateChat, markAsRead } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/messages/:partnerId', getMessages);
router.post('/send', sendMessage);
router.post('/initiate', initiateChat);
router.patch('/read/:partnerId', markAsRead);

export default router;
