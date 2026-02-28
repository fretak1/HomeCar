import { registerUser, loginUser, logoutUser, getUsers, getUserById, getCurrentUser, updateCurrentUser, submitAgentVerification, verifyUser } from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Router } from 'express';

const router = Router();

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/', authenticate, getUsers);
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, upload.single('profileImage'), updateCurrentUser);
router.get('/:id', authenticate, getUserById);
router.patch('/verify', authenticate, upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), submitAgentVerification);
router.patch('/:id/verify', authenticate, isAdmin, verifyUser);

export default router;
