import { Router } from 'express';
import { getLeases, createLease, updateLeaseStatus, acceptLease, requestLeaseCancellation, updateLease } from '../controllers/leaseController.js';
import { downloadLeaseContract } from '../controllers/receiptController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getLeases);
router.get('/:id/contract', authenticate, downloadLeaseContract);
router.post('/', authenticate, createLease);
router.patch('/:id', authenticate, updateLeaseStatus);
router.patch('/:id/update', authenticate, updateLease);
router.post('/:id/accept', authenticate, acceptLease);
router.post('/:id/cancel', authenticate, requestLeaseCancellation);

export default router;
