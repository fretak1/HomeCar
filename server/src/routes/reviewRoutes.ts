import express from 'express';
import { createReview, getPropertyReviews, deleteReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route to get reviews for a property
router.get('/', getPropertyReviews);
router.get('/property/:propertyId', getPropertyReviews);

// Protected routes
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
