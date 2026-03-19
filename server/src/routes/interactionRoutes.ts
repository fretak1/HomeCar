import { Router } from 'express';
import * as interactionController from '../controllers/interactionController.js';

const router = Router();

router.post('/view', interactionController.logPropertyView);
router.post('/search', interactionController.logSearchFilter);
router.post('/map', interactionController.logMapInteraction);

export default router;
