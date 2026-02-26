import express from 'express';
import { getUserFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all favorite routes
router.use(authenticate);

// GET /api/favorites
router.get('/', getUserFavorites);

// POST /api/favorites
router.post('/', addFavorite);

// DELETE /api/favorites/:propertyId
router.delete('/:propertyId', removeFavorite);

export default router;
