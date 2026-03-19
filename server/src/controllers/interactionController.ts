import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logPropertyView = async (req: Request, res: Response) => {
    try {
        const { propertyId, userId } = req.body;
        if (!propertyId || !userId) {
            return res.status(400).json({ error: 'Property ID and User ID are required' });
        }

        const view = await prisma.propertyView.create({
            data: {
                propertyId,
                userId
            }
        });

        res.status(201).json(view);
    } catch (error) {
        console.error('Error logging property view:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logSearchFilter = async (req: Request, res: Response) => {
    try {
        const { userId, searchType, filters } = req.body;
        if (!userId || !searchType || !filters) {
            return res.status(400).json({ error: 'User ID, search type, and filters are required' });
        }

        const log = await prisma.searchFilterLog.create({
            data: {
                userId,
                searchType,
                filters
            }
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error logging search filter:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const logMapInteraction = async (req: Request, res: Response) => {
    try {
        const { userId, lat, lng, zoom } = req.body;
        if (!userId || lat === undefined || lng === undefined || zoom === undefined) {
            return res.status(400).json({ error: 'User ID, lat, lng, and zoom are required' });
        }

        const interaction = await prisma.mapInteraction.create({
            data: {
                userId,
                lat,
                lng,
                zoom
            }
        });

        res.status(201).json(interaction);
    } catch (error) {
        console.error('Error logging map interaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
