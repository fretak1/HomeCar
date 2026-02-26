import { Router } from 'express';
import { uploadFile, uploadFiles } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Generic upload for a single file
router.post('/single', authenticate, upload.single('file'), uploadFile);

// Generic upload for multiple files
router.post('/multiple', authenticate, upload.array('files', 10), uploadFiles);

export default router;
