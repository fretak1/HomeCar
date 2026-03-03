import express from 'express';
import { getTransactions } from '../controllers/transactionController.js';
import { downloadReceipt } from '../controllers/receiptController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getTransactions);
router.get('/:id/download', authenticate, downloadReceipt);

export default router;
