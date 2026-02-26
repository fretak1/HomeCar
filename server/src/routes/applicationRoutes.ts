import { Router } from 'express';
import { getApplications, addApplication, updateApplicationStatus } from '../controllers/applicationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getApplications);
router.post('/', authenticate, addApplication);
router.patch('/:id', authenticate, updateApplicationStatus);

export default router;
