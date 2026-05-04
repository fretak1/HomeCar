import express from 'express';
import { getVerificationHistory, getVerificationLogById, viewVerificationDocument } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/verification-history', authenticate, isAdmin, getVerificationHistory);
router.get('/verification-log/:id', authenticate, isAdmin, getVerificationLogById);
router.get('/verification-log/:logId/view', authenticate, isAdmin, viewVerificationDocument);

export default router;
