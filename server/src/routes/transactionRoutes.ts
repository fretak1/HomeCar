import { Router } from 'express';
import { getTransactions } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getTransactions);

export default router;
