import { Router } from 'express';
import { getLeases, createLease, updateLeaseStatus, acceptLease } from '../controllers/leaseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getLeases);
router.post('/', authenticate, createLease);
router.patch('/:id', authenticate, updateLeaseStatus);
router.post('/:id/accept', authenticate, acceptLease);

export default router;
