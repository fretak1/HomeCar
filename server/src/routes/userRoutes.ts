import { registerUser, loginUser, logoutUser, getCurrentUser, updateCurrentUser, getUsers } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Router } from 'express';

const router = Router();

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/', authenticate, getUsers);
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, upload.single('profileImage'), updateCurrentUser);

export default router;
