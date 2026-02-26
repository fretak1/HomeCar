import { Router } from 'express';
import { createProperty, getProperties, getPropertyById, getPropertiesByOwnerId, updateProperty, deleteProperty, verifyProperty } from '../controllers/propertyController.js';
import { authenticate, isAdmin, optionalAuthenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'ownershipDocument', maxCount: 1 },
    { name: 'ownerPhoto', maxCount: 1 }
]);

router.post('/create', authenticate, uploadFields, createProperty);
router.get('/', optionalAuthenticate, getProperties);
router.get('/owner/:ownerId', authenticate, getPropertiesByOwnerId);
router.get('/:id', optionalAuthenticate, getPropertyById);
router.patch('/:id', authenticate, uploadFields, updateProperty);
router.patch('/:id/verify', authenticate, isAdmin, verifyProperty);
router.delete('/:id', authenticate, deleteProperty);

export default router;

