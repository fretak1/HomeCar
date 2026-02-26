import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// GET /api/favorites
// Returns all favorites for a user, including the populated property data
export const getUserFavorites = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            include: {
                property: {
                    include: {
                        images: true,
                        location: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
};

// POST /api/favorites
// Adds a property to a user's favorites
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId,
                propertyId,
            },
            include: {
                property: {
                    include: {
                        images: true,
                        location: true
                    }
                }
            }
        });

        res.status(201).json(favorite);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Property is already in favorites' });
        }
        console.error('Error adding favorite:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
};

// DELETE /api/favorites/:propertyId
// Removes a property from a user's favorites
export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { propertyId } = req.params;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        await prisma.favorite.delete({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId,
                }
            }
        });

        res.status(200).json({ message: 'Favorite removed successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Favorite not found' });
        }
        console.error('Error removing favorite:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
};
