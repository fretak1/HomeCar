import { Router } from 'express';
import { 
    createProperty, 
    getProperties, 
    getPropertyById, 
    getPropertiesByOwnerId, 
    updateProperty, 
    deleteProperty, 
    verifyProperty,
    getSignedUrl,
    viewDocument
} from '../controllers/propertyController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'ownershipDocument', maxCount: 1 },
    { name: 'ownerPhoto', maxCount: 1 }
]);

router.post('/create', authenticate, uploadFields, createProperty);
router.get('/', getProperties);
router.get('/owner/:ownerId', authenticate, getPropertiesByOwnerId);
router.get('/:id', getPropertyById);
router.patch('/:id', authenticate, uploadFields, updateProperty);
router.get('/document/:docId/signed-url', authenticate, getSignedUrl);
router.get('/document/:docId/view', authenticate, viewDocument);
router.patch('/:id/verify', authenticate, isAdmin, verifyProperty);
router.delete('/:id', authenticate, deleteProperty);

export default router;

