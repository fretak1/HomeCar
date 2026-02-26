import { Router } from 'express';
import { getMaintenanceRequests, addMaintenanceRequest, updateMaintenanceStatus } from '../controllers/maintenanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getMaintenanceRequests);
router.post('/', authenticate, addMaintenanceRequest);
router.patch('/:id', authenticate, updateMaintenanceStatus);

export default router;
