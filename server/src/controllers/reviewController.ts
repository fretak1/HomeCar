import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Creates a new review for a property.
 * Enforces that the user must have a COMPLETED transaction for this property.
 */
export const createReview = async (req: any, res: Response) => {
    try {
        const { propertyId, rating, comment } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!propertyId || !rating) {
            return res.status(400).json({ error: 'Property ID and rating are required' });
        }

        // 1. Check if the user has a COMPLETED transaction for this property
        const completedTransaction = await prisma.transaction.findFirst({
            where: {
                propertyId,
                payerId: userId,
                status: 'COMPLETED'
            }
        });

        if (!completedTransaction) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only review properties you have successfully paid for or secured.'
            });
        }

        // 2. Check if user already reviewed this property
        const existingReview = await prisma.review.findFirst({
            where: {
                propertyId,
                reviewerId: userId
            }
        });

        let review;
        if (existingReview) {
            // Update existing review
            review = await prisma.review.update({
                where: { id: existingReview.id },
                data: {
                    rating: parseInt(rating),
                    comment
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    }
                }
            });
        } else {
            // Create new review
            review = await prisma.review.create({
                data: {
                    propertyId,
                    reviewerId: userId,
                    rating: parseInt(rating),
                    comment
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    }
                }
            });
        }

        res.status(201).json(review);
    } catch (error: any) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

/**
 * Fetches reviews for a specific property.
 */
export const getPropertyReviews = async (req: Request, res: Response) => {
    try {
        const { propertyId: pathId } = req.params;
        const { propertyId: queryId } = req.query as any;
        const propertyId = pathId || queryId;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        const reviews = await prisma.review.findMany({
            where: { propertyId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reviews);
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Deletes a review. Only the reviewer or an admin can delete.
 */
export const deleteReview = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        const review = await prisma.review.findUnique({ where: { id } });

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.reviewerId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.review.delete({ where: { id } });

        res.json({ message: 'Review deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
