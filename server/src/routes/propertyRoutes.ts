import { Router } from 'express';
import { createProperty, getProperties, getPropertyById, updateProperty, deleteProperty } from '../controllers/propertyController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'ownershipDocument', maxCount: 1 },
    { name: 'ownerPhoto', maxCount: 1 }
]);

router.post('/create', authenticate, uploadFields, createProperty);
router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.patch('/:id', authenticate, uploadFields, updateProperty);
router.delete('/:id', authenticate, deleteProperty);

export default router;

