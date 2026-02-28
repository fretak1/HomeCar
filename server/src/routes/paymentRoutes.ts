import { Router } from 'express';
import {
    createOwnerSubaccount,
    initializePayment,
    verifyWebhook,
    getBanks,
    verifyPayment
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public webhook route (Chapa calls this)
router.post('/webhook', verifyWebhook);

// Protected routes
router.get('/banks', authenticate, getBanks);
router.get('/verify/:txRef', authenticate, verifyPayment);
router.post('/subaccount', authenticate, createOwnerSubaccount);
router.post('/initialize', authenticate, initializePayment);

export default router;
